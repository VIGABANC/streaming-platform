import { z } from 'zod'
import type { LibrarySnapshot } from './types'
import { migrateLibrarySnapshot } from './migration'
import { SUPPORTED_SERVER_IDS } from '@/lib/settings'

export const BACKUP_SCHEMA_VERSION = 2 as const
export const LEGACY_BACKUP_SCHEMA_VERSION = 1 as const
export const BACKUP_LIMITS = {
  watchlist: 100,
  favorites: 100,
  ratings: 100,
  history: 100,
  continueWatching: 25,
} as const

const MAX_ID = 2_000_000_000
const MAX_TIMESTAMP = 4_102_444_800_000 // 2100-01-01

const id = z.number().int().min(1).max(MAX_ID)
const legacyMediaType = z.enum(['movie', 'tv'])
const mediaType = z.enum(['movie', 'tv', 'anime'])
const mediaSource = z.enum(['tmdb', 'anilist'])
const mediaKind = z.enum(['movie', 'tv', 'anime'])
const optionalText = (max: number) => z.string().max(max).optional()
const optionalPath = z.string().max(256).nullable().optional()
const timestamp = z.number().int().min(0).max(MAX_TIMESTAMP)
const optionalSeasonPart = z.number().int().min(0).max(1000).optional()
const optionalEpisodePart = z.number().int().min(1).max(1000).optional()

const legacyMediaFields = {
  id,
  title: optionalText(500),
  name: optionalText(500),
  overview: optionalText(5000),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  vote_average: z.number().finite().min(0).max(10).optional(),
  release_date: optionalText(32),
  first_air_date: optionalText(32),
  media_type: legacyMediaType,
}

const mediaIdentity = {
  source: mediaSource,
  sourceId: id,
  kind: mediaKind,
}

const sourceAwareMediaFields = {
  ...legacyMediaFields,
  media_type: mediaType,
  ...mediaIdentity,
}

const legacyWatchlistItem = z.object({
  ...legacyMediaFields,
  addedAt: timestamp,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
}).strict()

const legacyFavoriteItem = z.object({
  ...legacyMediaFields,
  addedAt: timestamp,
  favoritedAt: timestamp,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
}).strict()

const legacyRatingItem = z.object({
  id,
  media_type: legacyMediaType,
  rating: z.number().finite().min(1).max(10),
  ratedAt: timestamp,
  title: optionalText(500),
  poster_path: optionalPath,
}).strict()

const legacyHistoryItem = z.object({
  id,
  media_type: legacyMediaType,
  title: z.string().max(500),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
  episodeTitle: optionalText(500),
  watchedAt: timestamp,
}).strict()

const legacyContinueWatchingItem = z.object({
  id,
  media_type: legacyMediaType,
  title: z.string().max(500),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
  episodeTitle: optionalText(500),
  lastOpenedAt: timestamp,
}).strict()

const profile = z.object({
  name: z.string().trim().min(1).max(100),
  avatar: z.string().max(64),
  bio: z.string().max(500),
  joinedAt: timestamp,
}).strict()

const settings = z.object({
  autoplayNext: z.boolean(),
  defaultServer: z.enum(SUPPORTED_SERVER_IDS),
  streamQuality: z.enum(['auto', '1080p', '720p']),
  ambientLighting: z.boolean(),
  reducedMotion: z.boolean(),
}).strict()

const sourceAwareWatchlistItem = z.object({
  ...sourceAwareMediaFields,
  addedAt: timestamp,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
}).strict()

const sourceAwareFavoriteItem = z.object({
  ...sourceAwareMediaFields,
  addedAt: timestamp,
  favoritedAt: timestamp,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
}).strict()

const sourceAwareRatingItem = z.object({
  id,
  media_type: mediaType,
  ...mediaIdentity,
  rating: z.number().finite().min(1).max(10),
  ratedAt: timestamp,
  title: optionalText(500),
  poster_path: optionalPath,
}).strict()

const sourceAwareHistoryItem = z.object({
  id,
  media_type: mediaType,
  ...mediaIdentity,
  title: z.string().max(500),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
  episodeTitle: optionalText(500),
  watchedAt: timestamp,
}).strict()

const sourceAwareContinueWatchingItem = z.object({
  id,
  media_type: mediaType,
  ...mediaIdentity,
  title: z.string().max(500),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  season: optionalSeasonPart,
  episode: optionalEpisodePart,
  episodeTitle: optionalText(500),
  lastOpenedAt: timestamp,
}).strict()

const backupV1 = z.object({
  schemaVersion: z.literal(LEGACY_BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), 'Invalid export date'),
  watchlist: z.array(legacyWatchlistItem).max(BACKUP_LIMITS.watchlist),
  favorites: z.array(legacyFavoriteItem).max(BACKUP_LIMITS.favorites),
  ratings: z.array(legacyRatingItem).max(BACKUP_LIMITS.ratings),
  history: z.array(legacyHistoryItem).max(BACKUP_LIMITS.history),
  continueWatching: z.array(legacyContinueWatchingItem).max(BACKUP_LIMITS.continueWatching),
  profile,
  settings,
}).strict()

const backupV2 = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), 'Invalid export date'),
  watchlist: z.array(sourceAwareWatchlistItem).max(BACKUP_LIMITS.watchlist),
  favorites: z.array(sourceAwareFavoriteItem).max(BACKUP_LIMITS.favorites),
  ratings: z.array(sourceAwareRatingItem).max(BACKUP_LIMITS.ratings),
  history: z.array(sourceAwareHistoryItem).max(BACKUP_LIMITS.history),
  continueWatching: z.array(sourceAwareContinueWatchingItem).max(BACKUP_LIMITS.continueWatching),
  profile,
  settings,
}).strict()

export type ImportFailureReason = 'invalid-json' | 'unsupported-version' | 'invalid-schema' | 'too-large' | 'storage-error'
export type ImportResult =
  | { ok: true; snapshot: LibrarySnapshot }
  | { ok: false; reason: ImportFailureReason }

function migrateLegacy(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const data = value as Record<string, unknown>
  if (data.schemaVersion === undefined && data.version === '1.0') {
    const { version: _version, ...rest } = data
    return { ...rest, schemaVersion: LEGACY_BACKUP_SCHEMA_VERSION }
  }
  return value
}

export function parseLibraryBackup(json: string): ImportResult {
  let parsed: unknown
  try {
    parsed = migrateLegacy(JSON.parse(json))
  } catch {
    return { ok: false, reason: 'invalid-json' }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ok: false, reason: 'invalid-schema' }
  const version = (parsed as { schemaVersion?: unknown }).schemaVersion
  if (version !== LEGACY_BACKUP_SCHEMA_VERSION && version !== BACKUP_SCHEMA_VERSION) {
    return { ok: false, reason: 'unsupported-version' }
  }

  const result = (version === LEGACY_BACKUP_SCHEMA_VERSION ? backupV1 : backupV2).safeParse(parsed)
  if (!result.success) {
    const tooLarge = Object.entries(BACKUP_LIMITS).some(([key, max]) => {
      const value = (parsed as Record<string, unknown>)[key]
      return Array.isArray(value) && value.length > max
    })
    return { ok: false, reason: tooLarge ? 'too-large' : 'invalid-schema' }
  }

  const { schemaVersion: _schemaVersion, ...snapshot } = result.data
  const migrated = migrateLibrarySnapshot({ ...snapshot, version })
  return migrated ? { ok: true, snapshot: migrated as LibrarySnapshot } : { ok: false, reason: 'invalid-schema' }
}

export function serializeLibraryBackup(snapshot: LibrarySnapshot): string {
  // Internal snapshots may still contain legacy TMDB records from the store;
  // normalize them as v1 input before emitting the strict v2 wire format.
  const migrated = migrateLibrarySnapshot({ ...snapshot, version: LEGACY_BACKUP_SCHEMA_VERSION })
  if (!migrated) throw new Error('INVALID_LIBRARY_SNAPSHOT')
  const wire = {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: migrated.exportedAt,
    watchlist: migrated.watchlist,
    favorites: migrated.favorites,
    ratings: migrated.ratings,
    history: migrated.history,
    continueWatching: migrated.continueWatching,
    profile: migrated.profile,
    settings: migrated.settings,
  }
  const validated = backupV2.safeParse(wire)
  if (!validated.success) throw new Error('INVALID_LIBRARY_SNAPSHOT')
  return JSON.stringify(wire, null, 2)
}
