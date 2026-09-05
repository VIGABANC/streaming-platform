import { z } from 'zod'
import type { LibrarySnapshot } from './types'
import { SUPPORTED_SERVER_IDS } from '@/lib/settings'

export const BACKUP_SCHEMA_VERSION = 1 as const
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
const mediaType = z.enum(['movie', 'tv'])
const optionalText = (max: number) => z.string().max(max).optional()
const optionalPath = z.string().max(256).nullable().optional()
const timestamp = z.number().int().min(0).max(MAX_TIMESTAMP)
const optionalEpisodePart = z.number().int().min(1).max(1000).optional()

const mediaFields = {
  id,
  title: optionalText(500),
  name: optionalText(500),
  overview: optionalText(5000),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  vote_average: z.number().finite().min(0).max(10).optional(),
  release_date: optionalText(32),
  first_air_date: optionalText(32),
  media_type: mediaType,
}

const watchlistItem = z.object({
  ...mediaFields,
  addedAt: timestamp,
  season: optionalEpisodePart,
  episode: optionalEpisodePart,
}).strict()

const favoriteItem = z.object({
  ...mediaFields,
  addedAt: timestamp,
  favoritedAt: timestamp,
  season: optionalEpisodePart,
  episode: optionalEpisodePart,
}).strict()

const ratingItem = z.object({
  id,
  media_type: mediaType,
  rating: z.number().finite().min(1).max(10),
  ratedAt: timestamp,
  title: optionalText(500),
  poster_path: optionalPath,
}).strict()

const historyItem = z.object({
  id,
  media_type: mediaType,
  title: z.string().max(500),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  season: optionalEpisodePart,
  episode: optionalEpisodePart,
  episodeTitle: optionalText(500),
  watchedAt: timestamp,
}).strict()

const continueWatchingItem = z.object({
  id,
  media_type: mediaType,
  title: z.string().max(500),
  poster_path: optionalPath,
  backdrop_path: optionalPath,
  season: optionalEpisodePart,
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

const backup = z.object({
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: z.string().refine((value) => Number.isFinite(Date.parse(value)), 'Invalid export date'),
  watchlist: z.array(watchlistItem).max(BACKUP_LIMITS.watchlist),
  favorites: z.array(favoriteItem).max(BACKUP_LIMITS.favorites),
  ratings: z.array(ratingItem).max(BACKUP_LIMITS.ratings),
  history: z.array(historyItem).max(BACKUP_LIMITS.history),
  continueWatching: z.array(continueWatchingItem).max(BACKUP_LIMITS.continueWatching),
  profile,
  settings,
}).strict()

export type ImportFailureReason = 'invalid-json' | 'unsupported-version' | 'invalid-schema' | 'too-large'
export type ImportResult =
  | { ok: true; snapshot: LibrarySnapshot }
  | { ok: false; reason: ImportFailureReason }

function migrateLegacy(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const data = value as Record<string, unknown>
  if (data.schemaVersion === undefined && data.version === '1.0') {
    const { version: _version, ...rest } = data
    return { ...rest, schemaVersion: BACKUP_SCHEMA_VERSION }
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
  if (version !== BACKUP_SCHEMA_VERSION) return { ok: false, reason: 'unsupported-version' }

  const result = backup.safeParse(parsed)
  if (!result.success) {
    const tooLarge = Object.entries(BACKUP_LIMITS).some(([key, max]) => {
      const value = (parsed as Record<string, unknown>)[key]
      return Array.isArray(value) && value.length > max
    })
    return { ok: false, reason: tooLarge ? 'too-large' : 'invalid-schema' }
  }

  const { schemaVersion: _schemaVersion, ...snapshot } = result.data
  return { ok: true, snapshot: { ...snapshot, version: BACKUP_SCHEMA_VERSION } as LibrarySnapshot }
}

export function serializeLibraryBackup(snapshot: LibrarySnapshot): string {
  return JSON.stringify({
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: snapshot.exportedAt,
    watchlist: snapshot.watchlist,
    favorites: snapshot.favorites,
    ratings: snapshot.ratings,
    history: snapshot.history,
    continueWatching: snapshot.continueWatching,
    profile: snapshot.profile,
    settings: snapshot.settings,
  }, null, 2)
}
