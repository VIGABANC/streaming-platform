import { cache } from 'react'
import type {
  ProviderLink,
  WatchmodeInput,
  WatchmodeLinksResult,
  WatchmodeSourceResponse,
} from './types'

// This module is server-only by convention: WATCHMODE_API_KEY is never a NEXT_PUBLIC_* value.
const WATCHMODE_API = 'https://api.watchmode.com/v1'
export const WATCHMODE_REVALIDATE_SECONDS = 21600
export const WATCHMODE_TIMEOUT_MS = 5000

function positiveInteger(value: number | string): number | null {
  const text = typeof value === 'string' ? value.trim() : value
  const id = typeof text === 'number'
    ? text
    : /^\d+$/.test(text)
      ? Number(text)
      : NaN

  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function publicUnavailable(): WatchmodeLinksResult {
  return { status: 'unavailable', links: [] }
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function normalizeSource(source: WatchmodeSourceResponse): ProviderLink | null {
  const providerId = positiveInteger(source.source_id as number | string)
  const name = typeof source.name === 'string' ? source.name.trim() : ''
  const type = typeof source.type === 'string' ? source.type.trim() : ''
  const url = safeUrl(source.web_url) ?? safeUrl(source.ios_url) ?? safeUrl(source.android_url)

  if (providerId === null || !name || !type || !url) return null
  return { providerId, name, type, url }
}

async function fetchWithTimeout(url: string, apiKey: string): Promise<Response> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const request = fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-API-Key': apiKey,
      },
      next: { revalidate: WATCHMODE_REVALIDATE_SECONDS },
      signal: controller.signal,
    })

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new Error('Watchmode request timed out'))
      }, WATCHMODE_TIMEOUT_MS)
    })

    return await Promise.race([request, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export const getWatchmodeLinks = cache(async (
  input: WatchmodeInput,
): Promise<WatchmodeLinksResult> => {
  const apiKey = process.env.WATCHMODE_API_KEY?.trim()
  if (!apiKey) return { status: 'disabled', links: [] }

  const id = positiveInteger(input.tmdbId)
  const mediaType = input.mediaType ?? input.type
  const region = (input.region ?? 'US').trim().toUpperCase()

  if (id === null || !mediaType || !/^[A-Z]{2}$/.test(region)) return publicUnavailable()

  const endpoint = `${WATCHMODE_API}/title/${mediaType}-${id}/sources/?regions=${encodeURIComponent(region)}`

  try {
    const response = await fetchWithTimeout(endpoint, apiKey)
    if (!response.ok) return publicUnavailable()

    const payload = await response.json() as unknown
    if (!Array.isArray(payload)) return publicUnavailable()

    const links = payload
      .filter((source): source is WatchmodeSourceResponse => Boolean(source && typeof source === 'object'))
      .map(normalizeSource)
      .filter((link): link is ProviderLink => link !== null)

    return { status: 'success', links }
  } catch {
    return publicUnavailable()
  }
})
