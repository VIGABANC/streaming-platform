import type { EpisodeSummary } from './catalog-model'
import { fetchWithTimeout, ProviderTimeoutError } from './provider-http'

export type JikanErrorCode = 'JIKAN_NETWORK_ERROR' | 'JIKAN_RATE_LIMITED' | 'JIKAN_INVALID_RESPONSE' | 'JIKAN_NOT_FOUND' | 'JIKAN_REQUEST_FAILED'

export class JikanError extends Error {
  constructor(public readonly code: JikanErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'JikanError'
  }
}

const JIKAN_API = process.env.JIKAN_API_URL || 'https://api.jikan.moe/v4'

interface JikanEpisode {
  mal_id: number
  title?: string | null
  synopsis?: string | null
  aired?: string | null
  duration?: number | null
  images?: { jpg?: { image_url?: string | null } }
}

export function mapJikanEpisode(episode: JikanEpisode): EpisodeSummary {
  return {
    id: episode.mal_id,
    number: episode.mal_id,
    title: episode.title || `Episode ${episode.mal_id}`,
    overview: episode.synopsis || undefined,
    airDate: episode.aired || undefined,
    duration: episode.duration || undefined,
    imageUrl: episode.images?.jpg?.image_url || null,
  }
}

export async function getAnimeEpisodes(id: string | number, fetcher: typeof fetch = fetch): Promise<EpisodeSummary[]> {
  let response: Response
  try {
    response = await fetchWithTimeout(fetcher, `${JIKAN_API}/anime/${id}/episodes?page=1`, { next: { revalidate: 900 } })
  } catch (error) {
    if (error instanceof ProviderTimeoutError) throw new JikanError('JIKAN_NETWORK_ERROR', 'Jikan request timed out')
    throw new JikanError('JIKAN_NETWORK_ERROR')
  }
  if (response.status === 429) throw new JikanError('JIKAN_RATE_LIMITED')
  if (response.status === 404) throw new JikanError('JIKAN_NOT_FOUND')
  if (!response.ok) throw new JikanError('JIKAN_REQUEST_FAILED')
  try {
    const payload = await response.json() as { data?: JikanEpisode[] }
    if (!Array.isArray(payload.data)) throw new Error('invalid data')
    return payload.data.map(mapJikanEpisode)
  } catch {
    throw new JikanError('JIKAN_INVALID_RESPONSE')
  }
}
