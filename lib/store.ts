// ─────────────────────────────────────────────────────────────────────────────
// UserMediaStore — localStorage-backed reactive user data store
//
// Features: Watchlist, Favorites, Ratings, Continue Watching,
// Watch History, User Profile, Settings, Stats & Global Toast Dispatcher.
// ─────────────────────────────────────────────────────────────────────────────

import type { Media, MediaType } from './tmdb'

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
  media_type: MediaType
  addedAt: number
}

export interface FavoriteItem extends WatchlistItem {
  favoritedAt: number
}

export interface ContinueWatchingItem {
  id: number
  media_type: MediaType
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  season?: number
  episode?: number
  episodeTitle?: string
  lastOpenedAt: number
}

export interface RatingItem {
  id: number
  media_type: MediaType
  rating: number // 1 - 10
  ratedAt: number
  title?: string
  poster_path?: string | null
}

export interface HistoryItem {
  id: number
  media_type: MediaType
  title: string
  poster_path?: string | null
  backdrop_path?: string | null
  season?: number
  episode?: number
  episodeTitle?: string
  watchedAt: number
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
  removeFromWatchlist(id: number, mediaType: MediaType): void
  toggleWatchlist(item: WatchlistItem): void
  isInWatchlist(id: number, mediaType: MediaType): boolean

  // Favorites
  getFavorites(): FavoriteItem[]
  addToFavorites(item: FavoriteItem): void
  removeFromFavorites(id: number, mediaType: MediaType): void
  toggleFavorite(item: FavoriteItem): void
  isInFavorites(id: number, mediaType: MediaType): boolean

  // Ratings
  getRatings(): RatingItem[]
  getRating(id: number, mediaType: MediaType): number | null
  setRating(id: number, mediaType: MediaType, rating: number, meta?: { title?: string; poster_path?: string | null }): void
  removeRating(id: number, mediaType: MediaType): void

  // Continue Watching
  getContinueWatching(): ContinueWatchingItem[]
  updateContinueWatching(item: ContinueWatchingItem): void
  removeFromContinueWatching(id: number, mediaType: MediaType): void

  // Watch History
  getHistory(): HistoryItem[]
  addToHistory(item: Omit<HistoryItem, 'watchedAt'>): void
  removeFromHistory(id: number, mediaType: MediaType): void
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
  importData(json: string): boolean
}

// ── Storage keys ──────────────────────────────────────────────────────────────

export const STORE_KEYS = {
  watchlist: 'veyra-watchlist',
  favorites: 'veyra-favorites',
  ratings: 'veyra-ratings',
  continueWatching: 'veyra-continue-watching',
  history: 'veyra-history',
  profile: 'veyra-profile',
  settings: 'veyra-settings',
} as const

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
    storage.setItem(key, JSON.stringify(data))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('veyra-store-change', { detail: { key } }))
    }
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ── Implementation ────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  name: 'Night Signal Pioneer',
  avatar: 'signal-red',
  bio: 'Cinematic streaming enthusiast exploring the outer rim of cinema.',
  joinedAt: 1704067200000, // 2024-01-01
}

const DEFAULT_SETTINGS: UserSettings = {
  autoplayNext: true,
  defaultServer: 'vidsrc-wiki',
  streamQuality: 'auto',
  ambientLighting: true,
  reducedMotion: false,
}

class LocalStorageMediaStore implements UserMediaStore {
  // ── Watchlist ────────────────────────────────────────────────────────────

  getWatchlist(): WatchlistItem[] {
    return readStorage<WatchlistItem[]>(STORE_KEYS.watchlist, [])
  }

  addToWatchlist(item: WatchlistItem): void {
    const current = this.getWatchlist()
    const exists = current.some(
      (x) => x.id === item.id && x.media_type === item.media_type,
    )
    if (exists) return
    writeStorage(STORE_KEYS.watchlist, [item, ...current])
  }

  removeFromWatchlist(id: number, mediaType: MediaType): void {
    const current = this.getWatchlist()
    writeStorage(
      STORE_KEYS.watchlist,
      current.filter((x) => !(x.id === id && x.media_type === mediaType)),
    )
  }

  toggleWatchlist(item: WatchlistItem): void {
    if (this.isInWatchlist(item.id, item.media_type)) {
      this.removeFromWatchlist(item.id, item.media_type)
    } else {
      this.addToWatchlist(item)
    }
  }

  isInWatchlist(id: number, mediaType: MediaType): boolean {
    return this.getWatchlist().some(
      (x) => x.id === id && x.media_type === mediaType,
    )
  }

  // ── Favorites ────────────────────────────────────────────────────────────

  getFavorites(): FavoriteItem[] {
    return readStorage<FavoriteItem[]>(STORE_KEYS.favorites, [])
  }

  addToFavorites(item: FavoriteItem): void {
    const current = this.getFavorites()
    const exists = current.some(
      (x) => x.id === item.id && x.media_type === item.media_type,
    )
    if (exists) return
    writeStorage(STORE_KEYS.favorites, [item, ...current])
  }

  removeFromFavorites(id: number, mediaType: MediaType): void {
    const current = this.getFavorites()
    writeStorage(
      STORE_KEYS.favorites,
      current.filter((x) => !(x.id === id && x.media_type === mediaType)),
    )
  }

  toggleFavorite(item: FavoriteItem): void {
    if (this.isInFavorites(item.id, item.media_type)) {
      this.removeFromFavorites(item.id, item.media_type)
    } else {
      this.addToFavorites(item)
    }
  }

  isInFavorites(id: number, mediaType: MediaType): boolean {
    return this.getFavorites().some(
      (x) => x.id === id && x.media_type === mediaType,
    )
  }

  // ── Ratings ──────────────────────────────────────────────────────────────

  getRatings(): RatingItem[] {
    return readStorage<RatingItem[]>(STORE_KEYS.ratings, [])
  }

  getRating(id: number, mediaType: MediaType): number | null {
    const item = this.getRatings().find((r) => r.id === id && r.media_type === mediaType)
    return item ? item.rating : null
  }

  setRating(id: number, mediaType: MediaType, rating: number, meta?: { title?: string; poster_path?: string | null }): void {
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

  removeRating(id: number, mediaType: MediaType): void {
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
    const without = current.filter(
      (x) => !(x.id === item.id && x.media_type === item.media_type),
    )
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
    })
  }

  removeFromContinueWatching(id: number, mediaType: MediaType): void {
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
    const filtered = current.filter(
      (x) => !(x.id === item.id && x.media_type === item.media_type && x.season === item.season && x.episode === item.episode),
    )
    writeStorage(STORE_KEYS.history, [entry, ...filtered].slice(0, 100))
  }

  removeFromHistory(id: number, mediaType: MediaType): void {
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
    return readStorage<UserSettings>(STORE_KEYS.settings, DEFAULT_SETTINGS)
  }

  updateSettings(settings: Partial<UserSettings>): UserSettings {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
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
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      watchlist: this.getWatchlist(),
      favorites: this.getFavorites(),
      ratings: this.getRatings(),
      history: this.getHistory(),
      continueWatching: this.getContinueWatching(),
      profile: this.getProfile(),
      settings: this.getSettings(),
    }
    return JSON.stringify(data, null, 2)
  }

  importData(json: string): boolean {
    try {
      const data = JSON.parse(json)
      if (Array.isArray(data.watchlist)) writeStorage(STORE_KEYS.watchlist, data.watchlist)
      if (Array.isArray(data.favorites)) writeStorage(STORE_KEYS.favorites, data.favorites)
      if (Array.isArray(data.ratings)) writeStorage(STORE_KEYS.ratings, data.ratings)
      if (Array.isArray(data.history)) writeStorage(STORE_KEYS.history, data.history)
      if (Array.isArray(data.continueWatching)) writeStorage(STORE_KEYS.continueWatching, data.continueWatching)
      if (data.profile) writeStorage(STORE_KEYS.profile, data.profile)
      if (data.settings) writeStorage(STORE_KEYS.settings, data.settings)
      return true
    } catch {
      return false
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
    if (key === 'all' || e.key === key) onChange()
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
