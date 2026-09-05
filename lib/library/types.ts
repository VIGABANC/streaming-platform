import type {
  ContinueWatchingItem,
  FavoriteItem,
  HistoryItem,
  RatingItem,
  UserProfile,
  UserSettings,
  WatchlistItem,
} from '@/lib/store'
import { sourceKey } from '@/lib/media/types'
import { parseLibraryBackup } from './backup-schema'

export interface LibrarySnapshot {
  version: 2
  exportedAt: string
  watchlist: WatchlistItem[]
  favorites: FavoriteItem[]
  ratings: RatingItem[]
  history: HistoryItem[]
  continueWatching: ContinueWatchingItem[]
  profile: UserProfile
  settings: UserSettings
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Night Signal Pioneer',
  avatar: 'signal-red',
  bio: 'Cinematic streaming enthusiast exploring the outer rim of cinema.',
  joinedAt: 1704067200000,
}

const DEFAULT_SETTINGS: UserSettings = {
  autoplayNext: true,
  defaultServer: 'vidsrc-wiki',
  streamQuality: 'auto',
  ambientLighting: true,
  reducedMotion: false,
}

export function createEmptyLibrarySnapshot(): LibrarySnapshot {
  return {
    version: 2,
    exportedAt: new Date(0).toISOString(),
    watchlist: [],
    favorites: [],
    ratings: [],
    history: [],
    continueWatching: [],
    profile: { ...DEFAULT_PROFILE },
    settings: { ...DEFAULT_SETTINGS },
  }
}

function itemKey(item: { id: number; media_type: WatchlistItem['media_type']; source?: 'tmdb' | 'anilist'; sourceId?: number; kind?: WatchlistItem['media_type']; season?: number; episode?: number }): string {
  const source = item.source ?? (item.media_type === 'anime' ? 'anilist' : 'tmdb')
  const kind = item.kind ?? item.media_type
  const sourceId = item.sourceId ?? item.id
  return sourceKey({ source, sourceId, kind }, { season: item.season, episode: item.episode })
}

function timestampOf(item: { addedAt?: number; favoritedAt?: number; ratedAt?: number; watchedAt?: number; lastOpenedAt?: number }): number {
  return Math.max(item.addedAt ?? 0, item.favoritedAt ?? 0, item.ratedAt ?? 0, item.watchedAt ?? 0, item.lastOpenedAt ?? 0)
}

function mergeCollection<T extends { id: number; media_type: WatchlistItem['media_type']; source?: 'tmdb' | 'anilist'; sourceId?: number; kind?: WatchlistItem['media_type']; season?: number; episode?: number; addedAt?: number; favoritedAt?: number; ratedAt?: number; watchedAt?: number; lastOpenedAt?: number }>(local: T[], remote: T[]): T[] {
  const merged = new Map<string, T>()
  for (const item of [...local, ...remote]) {
    const key = itemKey(item)
    const existing = merged.get(key)
    if (!existing || timestampOf(item) >= timestampOf(existing)) merged.set(key, { ...item })
  }
  return [...merged.values()].sort((a, b) => timestampOf(b) - timestampOf(a))
}

export function mergeLibrarySnapshots(local: LibrarySnapshot, remote: LibrarySnapshot): LibrarySnapshot {
  const newerProfile = remote.exportedAt >= local.exportedAt ? remote.profile : local.profile
  const newerSettings = remote.exportedAt >= local.exportedAt ? remote.settings : local.settings

  return {
    version: 2,
    exportedAt: remote.exportedAt >= local.exportedAt ? remote.exportedAt : local.exportedAt,
    watchlist: mergeCollection(local.watchlist, remote.watchlist),
    favorites: mergeCollection(local.favorites, remote.favorites),
    ratings: mergeCollection(local.ratings, remote.ratings),
    history: mergeCollection(local.history, remote.history),
    continueWatching: mergeCollection(local.continueWatching, remote.continueWatching),
    profile: { ...newerProfile },
    settings: { ...newerSettings },
  }
}

export function normalizeLibrarySnapshot(value: unknown): LibrarySnapshot | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  if (data.schemaVersion !== undefined || data.version === 1 || data.version === 2) {
    const schemaVersion = data.schemaVersion ?? (data.version === 1 ? 1 : 2)
    const result = parseLibraryBackup(JSON.stringify({ ...data, schemaVersion }))
    return result.ok ? result.snapshot : null
  }
  return null
}
