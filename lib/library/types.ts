import type {
  ContinueWatchingItem,
  FavoriteItem,
  HistoryItem,
  RatingItem,
  UserProfile,
  UserSettings,
  WatchlistItem,
} from '@/lib/store'

export interface LibrarySnapshot {
  version: 1
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
    version: 1,
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

function itemKey(item: { id: number; media_type: string; season?: number; episode?: number }): string {
  return [item.media_type, item.id, item.season ?? '', item.episode ?? ''].join(':')
}

function timestampOf(item: { addedAt?: number; favoritedAt?: number; ratedAt?: number; watchedAt?: number; lastOpenedAt?: number }): number {
  return Math.max(item.addedAt ?? 0, item.favoritedAt ?? 0, item.ratedAt ?? 0, item.watchedAt ?? 0, item.lastOpenedAt ?? 0)
}

function mergeCollection<T extends { id: number; media_type: string; season?: number; episode?: number; addedAt?: number; favoritedAt?: number; ratedAt?: number; watchedAt?: number; lastOpenedAt?: number }>(local: T[], remote: T[]): T[] {
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
    version: 1,
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
  if (!value || typeof value !== 'object') return null
  const data = value as Partial<LibrarySnapshot> & { version?: unknown }
  if (!Array.isArray(data.watchlist) || !Array.isArray(data.favorites) || !Array.isArray(data.ratings) || !Array.isArray(data.history) || !Array.isArray(data.continueWatching)) return null
  if (!data.profile || typeof data.profile !== 'object' || !data.settings || typeof data.settings !== 'object') return null

  return {
    version: 1,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date(0).toISOString(),
    watchlist: data.watchlist as WatchlistItem[],
    favorites: data.favorites as FavoriteItem[],
    ratings: data.ratings as RatingItem[],
    history: data.history as HistoryItem[],
    continueWatching: data.continueWatching as ContinueWatchingItem[],
    profile: data.profile as UserProfile,
    settings: data.settings as UserSettings,
  }
}
