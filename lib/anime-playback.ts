// ─────────────────────────────────────────────────────────────────────────────
// Anime playback resolution — wires the self-hosted Consumet instance into the
// playback resolver chain for the anime watch route ONLY. Movie/TV resolution
// never touches this module.
// server-only: never import this from a client component.
// ─────────────────────────────────────────────────────────────────────────────

import 'server-only'
import {
  type ConsumetEpisode,
  type ConsumetSource,
  type ConsumetSubtitle,
} from './providers/consumet'
import { fetchFromAllProviders } from './providers/anime-orchestrator'
import { getConsumetHealth, type ConsumetHealthResult } from './provider-health'
import type { PlaybackSource } from './player'

export type AnimePlaybackStatus =
  | 'unconfigured'
  | 'provider-unavailable'
  | 'episode-unavailable'
  | 'ready'

export interface AnimeProviderAttempt {
  providerId: string
  providerName: string
  status: 'success' | 'failure'
  sourceCount: number
  latencyMs: number
  error?: string
}

export interface AnimePlaybackResolution {
  status: AnimePlaybackStatus
  health: ConsumetHealthResult
  source?: PlaybackSource
  episodes?: ConsumetEpisode[]
  attempts?: AnimeProviderAttempt[]
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

/**
 * Resolves anime playback for one Jikan/MAL episode. Never falls back to a
 * public instance or to movie/TV providers — the honest unavailable states
 * are returned instead.
 */
const resolutionCache = new Map<string, { value: AnimePlaybackResolution; expiresAt: number }>()

export function getCachedAnimePlayback(malId: number, episodeNumber: number): AnimePlaybackResolution | null {
  const cached = resolutionCache.get(`${malId}:${episodeNumber}`)
  return cached && cached.expiresAt > Date.now() ? cached.value : null
}

export async function resolveAnimePlayback(options: {
  malId: number
  episodeNumber: number
  forceHealth?: boolean
}): Promise<AnimePlaybackResolution> {
  const cacheKey = `${options.malId}:${options.episodeNumber}`
  const cached = resolutionCache.get(cacheKey)
  if (!options.forceHealth && cached && cached.expiresAt > Date.now()) return cached.value

  const health = await getConsumetHealth(options.forceHealth ?? false)
  if (!health.configured) return { status: 'unconfigured', health }
  if (health.status !== 'healthy' && health.status !== 'degraded') return { status: 'provider-unavailable', health }

  const results = await fetchFromAllProviders(options.malId, options.episodeNumber)
  const attempts: AnimeProviderAttempt[] = results.map((result) => ({
    providerId: result.providerId, providerName: result.providerName, status: result.status,
    sourceCount: result.sources.length, latencyMs: result.latencyMs, error: result.error,
  }))
  const winner = results.find((result) => result.status === 'success' && result.sources.length > 0)
  if (!winner) {
    const value = { status: 'episode-unavailable' as const, health, attempts }
    resolutionCache.set(cacheKey, { value, expiresAt: Date.now() + 300_000 })
    return value
  }

  const candidateSources: ConsumetSource[] = winner.sources.map((source) => ({ url: source.url, quality: source.quality, isM3U8: source.isM3U8 }))
  const source = pickPlaybackSource(`${winner.providerId}:${options.malId}:${options.episodeNumber}`, candidateSources, winner.subtitles.map((subtitle) => ({ url: subtitle.url, lang: subtitle.lang })))
  if (!source) {
    const value = { status: 'episode-unavailable' as const, health, attempts }
    resolutionCache.set(cacheKey, { value, expiresAt: Date.now() + 300_000 })
    return value
  }
  const value = { status: 'ready' as const, source, health, attempts }
  resolutionCache.set(cacheKey, { value, expiresAt: Date.now() + 300_000 })
  return value
}
