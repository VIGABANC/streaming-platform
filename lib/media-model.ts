/** Stable VEYRA domain contracts. Provider response shapes must be mapped here
 * before they reach pages or reusable UI components. */

export type ContentTaxonomy =
  | 'movie'
  | 'series'
  | 'anime'
  | 'anime-movie'
  | 'anime-series'
  | 'ongoing'
  | 'completed'
  | 'upcoming'
  | 'specials'
  | 'season'
  | 'episode'

export const CONTENT_TAXONOMY: ReadonlyArray<{ id: ContentTaxonomy; label: string }> = [
  { id: 'movie', label: 'Movies' },
  { id: 'series', label: 'TV Series' },
  { id: 'anime', label: 'Anime' },
  { id: 'anime-movie', label: 'Anime Movies' },
  { id: 'anime-series', label: 'Anime Series' },
  { id: 'ongoing', label: 'Ongoing / Airing' },
  { id: 'completed', label: 'Completed' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'specials', label: 'Specials' },
  { id: 'season', label: 'Seasons' },
  { id: 'episode', label: 'Episodes' },
]

export interface MediaItem {
  id: string | number
  canonicalId: string
  kind: 'movie' | 'series' | 'anime'
  titles: { preferred: string; original?: string; english?: string; alternatives: string[] }
  overview?: string
  posterUrl?: string | null
  backdropUrl?: string | null
  genres: string[]
  releaseDate?: string
  status?: string
  score?: number
  source: string
  sourceId: string
  attribution: string
}

export interface Movie extends MediaItem {
  kind: 'movie'
  runtimeMinutes?: number
  collection?: Collection
}

export interface Series extends MediaItem {
  kind: 'series'
  seasons: Season[]
  episodeCount?: number
}

export interface Anime extends MediaItem {
  kind: 'anime'
  format: 'movie' | 'series' | 'special' | 'ona' | 'ova'
  studios: string[]
  episodeCount?: number
  airingStatus?: string
  nextAiringEpisode?: number
  seasons: Season[]
}

export interface Season {
  id: string | number
  number: number
  title: string
  episodeCount?: number
  airDate?: string
  episodes: Episode[]
}

export interface Episode {
  id: string | number
  number: number
  title: string
  seasonNumber?: number
  overview?: string
  airDate?: string
  durationMinutes?: number
  isSpecial?: boolean
}

export type ProviderAuthorizationStatus = 'authorized' | 'unverified' | 'prohibited'
export type PlaybackMode = 'external-embed' | 'native-media'
export type ProviderCapability = 'none' | 'provider-ui' | 'provider-controlled' | 'documented-api' | 'native'
export type PlaybackVerification = 'frame-load-only' | 'documented-api' | 'native-events'
export type PlaybackAvailability = 'available' | 'unavailable' | 'unsupported' | 'unverified'

export type PlaybackVerificationStage = 'metadata' | 'detail' | 'watch-route' | 'playback-signal'
export type PlaybackSignal = 'loadedmetadata' | 'canplay' | 'playing' | 'provider-reported-state'

export interface PlaybackVerificationEvidence {
  stage: PlaybackVerificationStage
  passed: boolean
  checkedAt: string
  url?: string
  signal?: PlaybackSignal
  detail?: string
}

export interface PlaybackProviderVerification {
  providerId: string
  authorizationEvidence: string[]
  originChecks: string[]
  allowedEmbeddingContexts: ('same-origin' | 'cross-origin-iframe' | 'native-media')[]
  lastVerifiedAt: string | null
  verificationMethod: 'manual-review' | 'automated-smoke' | 'provider-documentation'
  riskNotes: string[]
  enabled: boolean
  evidence?: PlaybackVerificationEvidence[]
}

export interface ProviderAvailability {
  providerId: string
  displayName: string
  authorizationStatus: ProviderAuthorizationStatus
  availability: PlaybackAvailability
  supportedRegions: string[]
  mode: PlaybackMode
  qualityCapability: ProviderCapability
  subtitleCapability: ProviderCapability
  audioTrackCapability: ProviderCapability
  lastErrorCategory?: string | null
}

export interface PlaybackSource {
  id: string
  providerId: string
  providerName: string
  mode: PlaybackMode
  mediaType: 'movie' | 'tv' | 'anime'
  url: string
  format?: 'mp4' | 'hls' | 'dash'
  origin: string
  availability: PlaybackAvailability
  verification: PlaybackVerification
  authorizationStatus: ProviderAuthorizationStatus
  qualityCapability: ProviderCapability
  subtitleCapability: ProviderCapability
  audioTrackCapability: ProviderCapability
  documentedReadiness: 'none' | 'frame-load' | 'documented-api'
}

export interface Person {
  id: string | number
  name: string
  role?: string
  character?: string
  profileUrl?: string | null
}

export interface Collection {
  id: string | number
  name: string
  items: MediaItem[]
  posterUrl?: string | null
  backdropUrl?: string | null
}

export type Franchise = Collection & { kind: 'franchise' }
