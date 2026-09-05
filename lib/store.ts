// ─────────────────────────────────────────────────────────────────────────────
// UserMediaStore — localStorage-backed reactive user data store
//
// Features: Watchlist, Favorites, Ratings, Continue Watching,
// Watch History, User Profile, Settings, Stats & Global Toast Dispatcher.
// ─────────────────────────────────────────────────────────────────────────────

import type { Media, MediaType } from './tmdb'
import { sourceKey, type LibraryMediaType, type MediaKind, type MediaSource } from './media/types'
import { parseLibraryBackup, serializeLibraryBackup, type ImportResult } from './library/backup-schema'
import { DEFAULT_USER_SETTINGS, normalizeUserSettings } from './settings'

// ── Data types ────────────────────────────────────────────────────────────────

export interface WatchlistItem extends Pick<
  Media,
  | 'id'
  | 'title'
  | 'name'
  | 'poster_path'
  | 'vote_average'
  | 'release_date'
  | 'first_air_date'
  | 'overview'
  | 'backdrop_path'
> {
  media_type: LibraryMediaType
  addedAt: number
  source?: MediaSource
  sourceId?: number
  kind?: MediaKind
}

export interface FavoriteItem extends WatchlistItem {
  favoritedAt: number
}

export interface ContinueWatchingItem {
  id: number
  media_type: LibraryMediaType
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  season?: number
  episode?: number
  episodeTitle?: string
  lastOpenedAt: number
  source?: MediaSource
  sourceId?: number
  kind?: MediaKind
}

export interface RatingItem {
  id: number
  media_type: LibraryMediaType
  rating: number // 1 - 10
  ratedAt: number
  title?: string
  poster_path?: string | null
  source?: MediaSource
  sourceId?: number
  kind?: MediaKind
}

export interface HistoryItem {
  id: number
  media_type: LibraryMediaType
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  season?: number
  episode?: number
  episodeTitle?: string
  watchedAt: number
  source?: MediaSource
  sourceId?: number
  kind?: MediaKind
}

export interface UserProfile {
  name: string
  avatar: string
  bio: string
  joinedAt: number
}

export interface UserSettings {
  autoplayNext: boolean
  defaultServer: string
  streamQuality: 'auto' | '1080p' | '720p'
  ambientLighting: boolean
  reducedMotion: boolean
}

export interface WatchStats {
  totalWatchedCount: number
  watchlistCount: number
  favoritesCount: number
  ratingsCount: number
  averageGivenRating: number
  continueWatchingCount: number
}

// ── Interface ─────────────────────────────────────────────────────────────────

export interface UserMediaStore {
  // Watchlist
  getWatchlist(): WatchlistItem[]
  addToWatchlist(item: WatchlistItem): void
  removeFromWatchlist(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<WatchlistItem, 'source' | 'sourceId' | 'kind'>>): void
  toggleWatchlist(item: WatchlistItem): void
  isInWatchlist(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<WatchlistItem, 'source' | 'sourceId' | 'kind'>>): boolean

  // Favorites
  getFavorites(): FavoriteItem[]
  addToFavorites(item: FavoriteItem): void
  removeFromFavorites(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<FavoriteItem, 'source' | 'sourceId' | 'kind'>>): void
  toggleFavorite(item: FavoriteItem): void
  isInFavorites(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<FavoriteItem, 'source' | 'sourceId' | 'kind'>>): boolean

  // Ratings
  getRatings(): RatingItem[]
  getRating(id: number, mediaType: LibraryMediaType): number | null
  setRating(id: number, mediaType: LibraryMediaType, rating: number, meta?: { title?: string; poster_path?: string | null }): void
  removeRating(id: number, mediaType: LibraryMediaType): void

  // Continue Watching
  getContinueWatching(): ContinueWatchingItem[]
  updateContinueWatching(item: ContinueWatchingItem): void
  removeFromContinueWatching(id: number, mediaType: LibraryMediaType): void

  // Watch History
  getHistory(): HistoryItem[]
  addToHistory(item: Omit<HistoryItem, 'watchedAt'>): void
  removeFromHistory(id: number, mediaType: LibraryMediaType): void
  clearHistory(): void

  // Profile
  getProfile(): UserProfile
  updateProfile(profile: Partial<UserProfile>): UserProfile

  // Settings
  getSettings(): UserSettings
  updateSettings(settings: Partial<UserSettings>): UserSettings

  // Stats & Utilities
  getWatchStats(): WatchStats
  clearAll(): void
  exportData(): string
  importData(json: string): ImportResult
}

// ── Storage keys ──────────────────────────────────────────────────────────────

export const STORE_KEYS = {
  snapshot: 'veyra-library-snapshot',
  watchlist: 'veyra-watchlist',
  favorites: 'veyra-favorites',
  ratings: 'veyra-ratings',
  continueWatching: 'veyra-continue-watching',
  history: 'veyra-history',
  profile: 'veyra-profile',
  settings: 'veyra-settings',
} as const

const SNAPSHOT_FIELD_BY_KEY: Record<string, string> = {
  [STORE_KEYS.watchlist]: 'watchlist',
  [STORE_KEYS.favorites]: 'favorites',
  [STORE_KEYS.ratings]: 'ratings',
  [STORE_KEYS.continueWatching]: 'continueWatching',
  [STORE_KEYS.history]: 'history',
  [STORE_KEYS.profile]: 'profile',
  [STORE_KEYS.settings]: 'settings',
}

// ── Safe localStorage helpers ─────────────────────────────────────────────────

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  if (typeof localStorage !== 'undefined') return localStorage
  return null
}

function readStorage<T>(key: string, fallback: T): T {
  const storage = getStorage()
  if (!storage) return fallback
  try {
    const snapshot = storage.getItem(STORE_KEYS.snapshot)
    const field = SNAPSHOT_FIELD_BY_KEY[key]
    if (snapshot && field) {
      const parsed = JSON.parse(snapshot) as Record<string, unknown>
      if (field in parsed) return parsed[field] as T
    }
    const raw = storage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeStorage<T>(key: string, data: T): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const snapshot = storage.getItem(STORE_KEYS.snapshot)
    const field = SNAPSHOT_FIELD_BY_KEY[key]
    if (snapshot && field) {
      const parsed = JSON.parse(snapshot) as Record<string, unknown>
      parsed[field] = data
      storage.setItem(STORE_KEYS.snapshot, JSON.stringify(parsed))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('veyra-store-change', { detail: { key } }))
      }
      return
    }
    storage.setItem(key, JSON.stringify(data))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('veyra-store-change', { detail: { key } }))
    }
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

function itemKey(item: { id: number; media_type: LibraryMediaType; source?: MediaSource; sourceId?: number; kind?: MediaKind; season?: number; episode?: number }): string {
  const source = item.source ?? (item.media_type === 'anime' ? 'anilist' : 'tmdb')
  const kind = item.kind ?? item.media_type
  const sourceId = item.sourceId ?? item.id
  return sourceKey({ source, sourceId, kind }, { season: item.season, episode: item.episode })
}

function matchesIdentity(
  item: { id: number; media_type: LibraryMediaType; source?: MediaSource; sourceId?: number; kind?: MediaKind; season?: number; episode?: number },
  id: number,
  mediaType: LibraryMediaType,
  identity?: Partial<Pick<WatchlistItem, 'source' | 'sourceId' | 'kind'>>,
): boolean {
  return itemKey(item) === itemKey({ id, media_type: mediaType, ...identity })
}

// ── Implementation ────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  name: 'Night Signal Pioneer',
  avatar: 'signal-red',
  bio: 'Cinematic streaming enthusiast exploring the outer rim of cinema.',
  joinedAt: 1704067200000, // 2024-01-01
}

const DEFAULT_SETTINGS: UserSettings = DEFAULT_USER_SETTINGS

class LocalStorageMediaStore implements UserMediaStore {
  // ── Watchlist ────────────────────────────────────────────────────────────

  getWatchlist(): WatchlistItem[] {
    return readStorage<WatchlistItem[]>(STORE_KEYS.watchlist, [])
  }

  addToWatchlist(item: WatchlistItem): void {
    const current = this.getWatchlist()
    const key = itemKey(item)
    const exists = current.some((x) => itemKey(x) === key)
    if (exists) return
    writeStorage(STORE_KEYS.watchlist, [item, ...current])
  }

  removeFromWatchlist(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<WatchlistItem, 'source' | 'sourceId' | 'kind'>>): void {
    const current = this.getWatchlist()
    writeStorage(
      STORE_KEYS.watchlist,
      current.filter((x) => !matchesIdentity(x, id, mediaType, identity)),
    )
  }

  toggleWatchlist(item: WatchlistItem): void {
    if (this.isInWatchlist(item.id, item.media_type, item)) {
      this.removeFromWatchlist(item.id, item.media_type, item)
    } else {
      this.addToWatchlist(item)
    }
  }

  isInWatchlist(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<WatchlistItem, 'source' | 'sourceId' | 'kind'>>): boolean {
    return this.getWatchlist().some((x) => matchesIdentity(x, id, mediaType, identity))
  }

  // ── Favorites ────────────────────────────────────────────────────────────

  getFavorites(): FavoriteItem[] {
    return readStorage<FavoriteItem[]>(STORE_KEYS.favorites, [])
  }

  addToFavorites(item: FavoriteItem): void {
    const current = this.getFavorites()
    const key = itemKey(item)
    const exists = current.some((x) => itemKey(x) === key)
    if (exists) return
    writeStorage(STORE_KEYS.favorites, [item, ...current])
  }

  removeFromFavorites(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<FavoriteItem, 'source' | 'sourceId' | 'kind'>>): void {
    const current = this.getFavorites()
    writeStorage(
      STORE_KEYS.favorites,
      current.filter((x) => !matchesIdentity(x, id, mediaType, identity)),
    )
  }

  toggleFavorite(item: FavoriteItem): void {
    if (this.isInFavorites(item.id, item.media_type, item)) {
      this.removeFromFavorites(item.id, item.media_type, item)
    } else {
      this.addToFavorites(item)
    }
  }

  isInFavorites(id: number, mediaType: LibraryMediaType, identity?: Partial<Pick<FavoriteItem, 'source' | 'sourceId' | 'kind'>>): boolean {
    return this.getFavorites().some((x) => matchesIdentity(x, id, mediaType, identity))
  }

  // ── Ratings ──────────────────────────────────────────────────────────────

  getRatings(): RatingItem[] {
    return readStorage<RatingItem[]>(STORE_KEYS.ratings, [])
  }

  getRating(id: number, mediaType: LibraryMediaType): number | null {
    const item = this.getRatings().find((r) => r.id === id && r.media_type === mediaType)
    return item ? item.rating : null
  }

  setRating(id: number, mediaType: LibraryMediaType, rating: number, meta?: { title?: string; poster_path?: string | null }): void {
    const current = this.getRatings()
    const filtered = current.filter((r) => !(r.id === id && r.media_type === mediaType))
    const item: RatingItem = {
      id,
      media_type: mediaType,
      rating: Math.max(1, Math.min(10, rating)),
      ratedAt: Date.now(),
      title: meta?.title,
      poster_path: meta?.poster_path,
    }
    writeStorage(STORE_KEYS.ratings, [item, ...filtered])
  }

  removeRating(id: number, mediaType: LibraryMediaType): void {
    const current = this.getRatings()
    writeStorage(
      STORE_KEYS.ratings,
      current.filter((r) => !(r.id === id && r.media_type === mediaType)),
    )
  }

  // ── Continue Watching ─────────────────────────────────────────────────────

  getContinueWatching(): ContinueWatchingItem[] {
    const items = readStorage<ContinueWatchingItem[]>(STORE_KEYS.continueWatching, [])
    return items.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
  }

  updateContinueWatching(item: ContinueWatchingItem): void {
    const current = this.getContinueWatching()
    const without = current.filter((x) => itemKey(x) !== itemKey(item))
    writeStorage(STORE_KEYS.continueWatching, [item, ...without].slice(0, 25))
    // Also record in watch history
    this.addToHistory({
      id: item.id,
      media_type: item.media_type,
      title: item.title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      season: item.season,
      episode: item.episode,
      episodeTitle: item.episodeTitle,
      source: item.source,
      sourceId: item.sourceId,
      kind: item.kind,
    })
  }

  removeFromContinueWatching(id: number, mediaType: LibraryMediaType): void {
    const current = this.getContinueWatching()
    writeStorage(
      STORE_KEYS.continueWatching,
      current.filter((x) => !(x.id === id && x.media_type === mediaType)),
    )
  }

  // ── Watch History ────────────────────────────────────────────────────────

  getHistory(): HistoryItem[] {
    const items = readStorage<HistoryItem[]>(STORE_KEYS.history, [])
    return items.sort((a, b) => b.watchedAt - a.watchedAt)
  }

  addToHistory(item: Omit<HistoryItem, 'watchedAt'>): void {
    const current = this.getHistory()
    const entry: HistoryItem = {
      ...item,
      watchedAt: Date.now(),
    }
    // De-duplicate same title / episode watched within the same day
    const filtered = current.filter((x) => itemKey(x) !== itemKey(item))
    writeStorage(STORE_KEYS.history, [entry, ...filtered].slice(0, 100))
  }

  removeFromHistory(id: number, mediaType: LibraryMediaType): void {
    const current = this.getHistory()
    writeStorage(
      STORE_KEYS.history,
      current.filter((x) => !(x.id === id && x.media_type === mediaType)),
    )
  }

  clearHistory(): void {
    writeStorage(STORE_KEYS.history, [])
  }

  // ── Profile ──────────────────────────────────────────────────────────────

  getProfile(): UserProfile {
    return readStorage<UserProfile>(STORE_KEYS.profile, DEFAULT_PROFILE)
  }

  updateProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getProfile()
    const updated = { ...current, ...profile }
    writeStorage(STORE_KEYS.profile, updated)
    return updated
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  getSettings(): UserSettings {
    return normalizeUserSettings(readStorage<unknown>(STORE_KEYS.settings, DEFAULT_SETTINGS))
  }

  updateSettings(settings: Partial<UserSettings>): UserSettings {
    const current = this.getSettings()
    const updated = normalizeUserSettings({ ...current, ...settings })
    writeStorage(STORE_KEYS.settings, updated)
    return updated
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  getWatchStats(): WatchStats {
    const history = this.getHistory()
    const watchlist = this.getWatchlist()
    const favorites = this.getFavorites()
    const ratings = this.getRatings()
    const continueWatching = this.getContinueWatching()

    const avgRating = ratings.length > 0
      ? Number((ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1))
      : 0

    return {
      totalWatchedCount: history.length,
      watchlistCount: watchlist.length,
      favoritesCount: favorites.length,
      ratingsCount: ratings.length,
      averageGivenRating: avgRating,
      continueWatchingCount: continueWatching.length,
    }
  }

  clearAll(): void {
    const storage = getStorage()
    if (!storage) return
    Object.values(STORE_KEYS).forEach((k) => storage.removeItem(k))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('veyra-store-change', { detail: { key: 'all' } }))
    }
  }

  exportData(): string {
    return serializeLibraryBackup({
      version: 2,
      exportedAt: new Date().toISOString(),
      watchlist: this.getWatchlist(),
      favorites: this.getFavorites(),
      ratings: this.getRatings(),
      history: this.getHistory(),
      continueWatching: this.getContinueWatching(),
      profile: this.getProfile(),
      settings: this.getSettings(),
    })
  }

  importData(json: string): ImportResult {
    const result = parseLibraryBackup(json)
    if (!result.ok) return result

    const storage = getStorage()
    if (!storage) return result

    try {
      // Keep imported state behind one storage key. A single setItem is the
      // atomic boundary; collection reads resolve through this snapshot.
      storage.setItem(STORE_KEYS.snapshot, JSON.stringify(result.snapshot))
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('veyra-store-change', { detail: { key: 'all' } }))
      return result
    } catch {
      return { ok: false, reason: 'invalid-schema' }
    }
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const store: UserMediaStore = new LocalStorageMediaStore()

// ── React hook & toast helpers ────────────────────────────────────────────────

export function subscribeToStorageChanges(
  key: (typeof STORE_KEYS)[keyof typeof STORE_KEYS] | 'all',
  onChange: () => void,
): () => void {
  if (typeof window === 'undefined') return () => {}

  const storageHandler = (e: StorageEvent) => {
    if (key === 'all' || e.key === key || e.key === STORE_KEYS.snapshot) onChange()
  }

  const customHandler = (e: Event) => {
    const ce = e as CustomEvent<{ key: string }>
    if (key === 'all' || ce.detail?.key === key || ce.detail?.key === 'all') {
      onChange()
    }
  }

  window.addEventListener('storage', storageHandler)
  window.addEventListener('veyra-store-change', customHandler)

  return () => {
    window.removeEventListener('storage', storageHandler)
    window.removeEventListener('veyra-store-change', customHandler)
  }
}

// ── Global Toast System ───────────────────────────────────────────────────────

export interface ToastMessage {
  id?: string
  title: string
  description?: string
  type?: 'success' | 'info' | 'warning' | 'error'
  durationMs?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function showToast(msg: ToastMessage): void {
  if (typeof window === 'undefined') return
  const id = msg.id || Math.random().toString(36).substring(2, 9)
  window.dispatchEvent(
    new CustomEvent('veyra-toast', {
      detail: { ...msg, id, durationMs: msg.durationMs ?? 3500 },
    }),
  )
}

export function mediaToWatchlistItem(
  media: Pick<Media, 'id' | 'title' | 'name' | 'poster_path' | 'backdrop_path' | 'vote_average' | 'release_date' | 'first_air_date' | 'overview'>,
  mediaType: MediaType,
): WatchlistItem {
  return {
    id: media.id,
    title: media.title,
    name: media.name,
    poster_path: media.poster_path,
    backdrop_path: media.backdrop_path,
    vote_average: media.vote_average,
    release_date: media.release_date,
    first_air_date: media.first_air_date,
    overview: media.overview,
    media_type: mediaType,
    addedAt: Date.now(),
    source: 'tmdb',
    sourceId: media.id,
    kind: mediaType,
  }
}

export function mediaToFavoriteItem(
  media: Pick<Media, 'id' | 'title' | 'name' | 'poster_path' | 'backdrop_path' | 'vote_average' | 'release_date' | 'first_air_date' | 'overview'>,
  mediaType: MediaType,
): FavoriteItem {
  return {
    ...mediaToWatchlistItem(media, mediaType),
    favoritedAt: Date.now(),
  }
}
