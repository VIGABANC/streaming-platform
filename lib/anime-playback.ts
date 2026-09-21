// ─────────────────────────────────────────────────────────────────────────────
// Anime playback resolution — wires the self-hosted Consumet instance into the
// playback resolver chain for the anime watch route ONLY. Movie/TV resolution
// never touches this module.
// server-only: never import this from a client component.
// ─────────────────────────────────────────────────────────────────────────────

import 'server-only'
import {
  getAnimeInfo,
  getEpisodeSources,
  ConsumetError,
  type ConsumetEpisode,
  type ConsumetSource,
  type ConsumetSubtitle,
} from './providers/consumet'
import { getConsumetHealth, type ConsumetHealthResult } from './provider-health'
import type { PlaybackSource } from './player'

export type AnimePlaybackStatus =
  | 'unconfigured'
  | 'provider-unavailable'
  | 'episode-unavailable'
  | 'ready'

export interface AnimePlaybackResolution {
  status: AnimePlaybackStatus
  health: ConsumetHealthResult
  /** Native playback source — present only in the 'ready' state. */
  source?: PlaybackSource
  /** Consumet episode list — present only in the 'ready' state. */
  episodes?: ConsumetEpisode[]
}

const CONSUMET_PROVIDER_ID = 'consumet'
const CONSUMET_PROVIDER_NAME = 'Consumet'

/** Maps one Consumet stream URL onto the native-media playback source contract. */
function toPlaybackSource(episodeId: string, candidate: ConsumetSource, subtitles: ConsumetSubtitle[]): PlaybackSource | null {
  let url: URL
  try {
    url = new URL(candidate.url)
  } catch {
    return null
  }
  // The native-media allowlist (see playback-resolver) enforces HTTPS sources
  // whose origin matches the URL itself.
  if (url.protocol !== 'https:') return null
  return {
    id: `${CONSUMET_PROVIDER_ID}:anime:${episodeId}`,
    providerId: CONSUMET_PROVIDER_ID,
    providerName: CONSUMET_PROVIDER_NAME,
    mode: 'native-media',
    mediaType: 'anime',
    url: url.toString(),
    origin: url.origin,
    format: candidate.isM3U8 ? 'hls' : 'mp4',
    subtitles: subtitles.map((subtitle) => ({ url: subtitle.url, lang: subtitle.lang })),
    availability: 'available',
    verification: 'native-events',
    authorizationStatus: 'authorized',
    qualityCapability: 'documented-api',
    subtitleCapability: 'documented-api',
    audioTrackCapability: 'none',
    documentedReadiness: 'documented-api',
  }
}

function pickPlaybackSource(episodeId: string, sources: ConsumetSource[], subtitles: ConsumetSubtitle[]): PlaybackSource | null {
  // Prefer a progressive file: native <video> plays mp4 in every browser,
  // while HLS only plays natively on Safari/iOS.
  const ordered = [...sources].sort((a, b) => Number(a.isM3U8) - Number(b.isM3U8))
  for (const candidate of ordered) {
    const source = toPlaybackSource(episodeId, candidate, subtitles)
    if (source) return source
  }
  return null
}

function isFetchError(error: unknown): error is ConsumetError {
  return error instanceof ConsumetError && error.code === 'CONSUMET_REQUEST_FAILED'
}

/**
 * Resolves anime playback for one Jikan/MAL episode. Never falls back to a
 * public instance or to movie/TV providers — the honest unavailable states
 * are returned instead.
 */
export async function resolveAnimePlayback(options: {
  malId: number
  episodeNumber: number
  forceHealth?: boolean
}): Promise<AnimePlaybackResolution> {
  const health = await getConsumetHealth(options.forceHealth ?? false)
  if (!health.configured) return { status: 'unconfigured', health }
  if (health.status !== 'healthy' && health.status !== 'degraded') {
    return { status: 'provider-unavailable', health }
  }

  let episodes: ConsumetEpisode[]
  try {
    episodes = await getAnimeInfo({ malId: options.malId })
  } catch (error) {
    if (error instanceof ConsumetError && error.code === 'CONSUMET_NOT_FOUND') {
      return { status: 'episode-unavailable', health }
    }
    if (isFetchError(error)) console.error('[anime-playback] consumet info request failed:', error.code)
    return { status: 'provider-unavailable', health }
  }

  const episode = episodes.find((entry) => entry.number === options.episodeNumber)
  if (!episode) return { status: 'episode-unavailable', health }

  try {
    const result = await getEpisodeSources(episode.id, { malId: options.malId })
    const source = pickPlaybackSource(episode.id, result.sources, result.subtitles)
    if (!source) return { status: 'episode-unavailable', health }
    return { status: 'ready', source, episodes, health }
  } catch (error) {
    if (error instanceof ConsumetError && error.code === 'CONSUMET_NOT_FOUND') {
      return { status: 'episode-unavailable', health }
    }
    if (isFetchError(error)) console.error('[anime-playback] consumet watch request failed:', error.code)
    return { status: 'provider-unavailable', health }
  }
}
