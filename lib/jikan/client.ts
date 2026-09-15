import { cache } from 'react'
import type { JikanAnimeResponse, JikanEnrichment } from './types'
import type { JikanTopAnimeResponse } from './types'

const JIKAN_API = 'https://api.jikan.moe/v4'
export const JIKAN_REVALIDATE_SECONDS = 86400
export const JIKAN_TIMEOUT_MS = 5000

function positiveInteger(value: number | string): number | null {
  const text = typeof value === 'string' ? value.trim() : value
  const id = typeof text === 'number'
    ? text
    : /^\d+$/.test(text)
      ? Number(text)
      : NaN

  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function posterUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === 'cdn.myanimelist.net' && url.pathname.startsWith('/images/') && !url.username && !url.password ? url.href : null
  } catch { return null }
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined

  try {
    const request = fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: JIKAN_REVALIDATE_SECONDS },
      signal: controller.signal,
    })

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort()
        reject(new Error('Jikan request timed out'))
      }, JIKAN_TIMEOUT_MS)
    })

    return await Promise.race([request, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export const getJikanEnrichment = cache(async (
  malId: number | string,
): Promise<JikanEnrichment | null> => {
  const id = positiveInteger(malId)
  if (id === null) return null

  try {
    const response = await fetchWithTimeout(`${JIKAN_API}/anime/${id}/full`)
    if (!response.ok) return null

    const payload = await response.json() as JikanAnimeResponse
    if (!payload || typeof payload !== 'object' || !payload.data || typeof payload.data !== 'object') {
      return null
    }

    return {
      score: nullableNumber(payload.data.score),
      rank: nullableNumber(payload.data.rank),
      popularity: nullableNumber(payload.data.popularity),
    }
  } catch {
    return null
  }
})

export interface JikanAnimeDetail {
  id: number
  title: string
  image: string | null
  synopsis: string
  score: number | null
  episodes: number | null
  type: string | null
  status: string | null
  airedFrom: string | null
  genres: string[]
}

export const getAnimeDetail = cache(async (
  malId: number | string,
): Promise<JikanAnimeDetail | null> => {
  const id = positiveInteger(malId)
  if (id === null) return null

  try {
    const response = await fetchWithTimeout(`${JIKAN_API}/anime/${id}/full`)
    if (!response.ok) return null

    const payload = await response.json() as JikanAnimeResponse
    const data = payload?.data
    const title = typeof data?.title === 'string' ? data.title : ''
    if (!data || !title || data.mal_id !== id) return null

    const airedFrom = typeof data.aired?.from === 'string' ? data.aired.from : null
    const genres = Array.isArray(data.genres) ? data.genres.flatMap((genre) => genre && typeof genre.name === 'string' ? [genre.name] : []) : []

    return {
      id,
      title,
      image: posterUrl(data.images?.jpg?.image_url),
      synopsis: typeof data.synopsis === 'string' ? data.synopsis : '',
      score: nullableNumber(data.score),
      episodes: typeof data.episodes === 'number' ? positiveInteger(data.episodes) : null,
      type: typeof data.type === 'string' ? data.type : null,
      status: typeof data.status === 'string' ? data.status : null,
      airedFrom,
      genres,
    }
  } catch {
    return null
  }
})

export const getTopAnime = cache(async () => {
  try {
    const response = await fetchWithTimeout(`${JIKAN_API}/top/anime?limit=20`)
    if (!response.ok) return []
    const payload = await response.json() as JikanTopAnimeResponse
    return (payload.data ?? []).flatMap((item) => {
      const id = positiveInteger(item.mal_id as number | string)
      const title = typeof item.title === 'string' ? item.title : ''
      if (id === null || !title) return []
      return [{ id, title, image: typeof item.images?.jpg?.image_url === 'string' ? item.images.jpg.image_url : null, synopsis: typeof item.synopsis === 'string' ? item.synopsis : '', score: nullableNumber(item.score) }]
    })
  } catch { return [] }
})
