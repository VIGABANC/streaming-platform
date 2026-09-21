// ─────────────────────────────────────────────────────────────────────────────
// Consumet — self-hosted anime source provider (server-only).
// VEYRA never falls back to a public Consumet instance: anime playback exists
// only when CONSUMET_BASE_URL points at the operator's own deployment.
// ─────────────────────────────────────────────────────────────────────────────

import 'server-only'
import { isStrictPositiveInteger } from '@/lib/player'

export interface ConsumetConfig {
  baseUrl: string
}

export type ConsumetLookup = {
  /** AniList media ID — resolved through Consumet's `anilist` provider. */
  anilistId?: number | string
  /** Jikan/MAL media ID — resolved through Consumet's `mal` provider. */
  malId?: number | string
}

export interface ConsumetEpisode {
  /** Consumet episode ID used by the watch endpoint. */
  id: string
  number: number
  title: string | null
}

export interface ConsumetSource {
  url: string
  quality: string | null
  isM3U8: boolean
}

export interface ConsumetSubtitle {
  url: string
  lang: string
}

export interface ConsumetEpisodeSources {
  sources: ConsumetSource[]
  subtitles: ConsumetSubtitle[]
  headers: Record<string, string>
}

export type ConsumetErrorCode =
  | 'CONSUMET_NOT_CONFIGURED'
  | 'CONSUMET_LOOKUP_INVALID'
  | 'CONSUMET_EPISODE_ID_INVALID'
  | 'CONSUMET_NOT_FOUND'
  | 'CONSUMET_REQUEST_FAILED'

export class ConsumetError extends Error {
  constructor(readonly code: ConsumetErrorCode, message?: string) {
    super(message ?? code)
  }
}

const CONSUMET_TIMEOUT_MS = 8_000

/**
 * The operator-configured Consumet instance, or null when unconfigured.
 * The value comes exclusively from CONSUMET_BASE_URL — there is no
 * public-instance fallback.
 */
export function getConsumetConfig(): ConsumetConfig | null {
  const raw = process.env.CONSUMET_BASE_URL?.trim() ?? ''
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return { baseUrl: url.href.replace(/\/+$/, '') }
  } catch {
    return null
  }
}

export function isConsumetConfigured(): boolean {
  return getConsumetConfig() !== null
}

function resolveLookup(lookup: ConsumetLookup): { provider: 'anilist' | 'mal'; id: number } {
  if (isStrictPositiveInteger(lookup.anilistId ?? '')) return { provider: 'anilist', id: Number(lookup.anilistId) }
  if (isStrictPositiveInteger(lookup.malId ?? '')) return { provider: 'mal', id: Number(lookup.malId) }
  throw new ConsumetError('CONSUMET_LOOKUP_INVALID')
}

function httpUrlOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

async function consumetFetch(path: string): Promise<unknown> {
  const config = getConsumetConfig()
  if (!config) throw new ConsumetError('CONSUMET_NOT_CONFIGURED')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CONSUMET_TIMEOUT_MS)
  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      // Episode sources rotate on the instance; always revalidate.
      cache: 'no-store',
    })
    if (response.status === 404) throw new ConsumetError('CONSUMET_NOT_FOUND')
    if (!response.ok) throw new ConsumetError('CONSUMET_REQUEST_FAILED')
    return await response.json()
  } catch (error) {
    if (error instanceof ConsumetError) throw error
    throw new ConsumetError('CONSUMET_REQUEST_FAILED')
  } finally {
    clearTimeout(timer)
  }
}

function parseEpisodes(payload: unknown): ConsumetEpisode[] {
  if (!payload || typeof payload !== 'object') return []
  const raw = (payload as { episodes?: unknown }).episodes
  if (!Array.isArray(raw)) return []
  const episodes: ConsumetEpisode[] = []
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object') return
    const record = entry as Record<string, unknown>
    if (typeof record.id !== 'string' || record.id.length === 0) return
    const number = typeof record.number === 'number' && Number.isFinite(record.number) && record.number > 0
      ? record.number
      : index + 1
    episodes.push({
      id: record.id,
      number,
      title: typeof record.title === 'string' && record.title.length > 0 ? record.title : null,
    })
  })
  return episodes
}

function parseSources(payload: unknown): ConsumetEpisodeSources {
  if (!payload || typeof payload !== 'object') return { sources: [], subtitles: [], headers: {} }
  const record = payload as Record<string, unknown>
  const sources: ConsumetSource[] = []
  if (Array.isArray(record.sources)) {
    for (const entry of record.sources) {
      if (!entry || typeof entry !== 'object') continue
      const candidate = entry as Record<string, unknown>
      const url = httpUrlOrNull(candidate.url)
      if (!url) continue
      sources.push({
        url,
        quality: typeof candidate.quality === 'string' ? candidate.quality : null,
        isM3U8: candidate.isM3U8 === true || /\.m3u8(\?|$)/i.test(url),
      })
    }
  }
  const subtitles: ConsumetSubtitle[] = []
  if (Array.isArray(record.subtitles)) {
    for (const entry of record.subtitles) {
      if (!entry || typeof entry !== 'object') continue
      const candidate = entry as Record<string, unknown>
      const url = httpUrlOrNull(candidate.url)
      if (!url) continue
      subtitles.push({ url, lang: typeof candidate.lang === 'string' && candidate.lang ? candidate.lang : 'en' })
    }
  }
  const headers: Record<string, string> = {}
  if (record.headers && typeof record.headers === 'object') {
    for (const [key, value] of Object.entries(record.headers as Record<string, unknown>)) {
      if (typeof value === 'string') headers[key] = value
    }
  }
  return { sources, subtitles, headers }
}

/**
 * Episode list for an anime, mapped from an AniList or Jikan/MAL ID through
 * the `anilist` / `mal` lookups Consumet exposes.
 */
export async function getAnimeInfo(lookup: ConsumetLookup): Promise<ConsumetEpisode[]> {
  const { provider, id } = resolveLookup(lookup)
  return parseEpisodes(await consumetFetch(`/anime/${provider}/info?id=${id}`))
}

/**
 * Playback sources, subtitles, and the request headers the instance reports
 * for a Consumet episode ID.
 */
export async function getEpisodeSources(episodeId: string, lookup: ConsumetLookup): Promise<ConsumetEpisodeSources> {
  if (typeof episodeId !== 'string' || episodeId.length === 0) {
    throw new ConsumetError('CONSUMET_EPISODE_ID_INVALID')
  }
  const { provider } = resolveLookup(lookup)
  return parseSources(await consumetFetch(`/anime/${provider}/watch/${encodeURIComponent(episodeId)}`))
}
