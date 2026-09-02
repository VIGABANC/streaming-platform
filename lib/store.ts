// ─────────────────────────────────────────────────────────────────────────────
// UserMediaStore — localStorage-backed user data store
//
// Architecture note: all state is accessed through this interface.
// To migrate to Supabase/backend storage, implement this interface
// against your remote store and swap the export below.
// ─────────────────────────────────────────────────────────────────────────────

import type { Media, MediaType } from './tmdb'

// ── Data types ────────────────────────────────────────────────────────────────

export interface WatchlistItem extends Pick<Media, 'id' | 'title' | 'name' | 'poster_path' | 'vote_average' | 'release_date' | 'first_air_date' | 'overview' | 'backdrop_path'> {
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
  /** Only for TV */
  season?: number
  /** Only for TV */
  episode?: number
  /** Episode title for TV */
  episodeTitle?: string
  lastOpenedAt: number
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

  // Continue Watching
  getContinueWatching(): ContinueWatchingItem[]
  updateContinueWatching(item: ContinueWatchingItem): void
  removeFromContinueWatching(id: number, mediaType: MediaType): void
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const KEYS = {
  watchlist: 'veyra-watchlist',
  favorites: 'veyra-favorites',
  continueWatching: 'veyra-continue-watching',
} as const

// ── Safe localStorage helpers ─────────────────────────────────────────────────

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  if (typeof localStorage !== 'undefined') return localStorage
  return null
}

function readStorage<T>(key: string): T[] {
  const storage = getStorage()
  if (!storage) return []
  try {
    const raw = storage.getItem(key)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

function writeStorage<T>(key: string, data: T[]): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(data))
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ── Implementation ────────────────────────────────────────────────────────────

class LocalStorageMediaStore implements UserMediaStore {
  // ── Watchlist ────────────────────────────────────────────────────────────

  getWatchlist(): WatchlistItem[] {
    return readStorage<WatchlistItem>(KEYS.watchlist)
  }

  addToWatchlist(item: WatchlistItem): void {
    const current = this.getWatchlist()
    const exists = current.some(
      (x) => x.id === item.id && x.media_type === item.media_type,
    )
    if (exists) return
    writeStorage(KEYS.watchlist, [item, ...current])
  }

  removeFromWatchlist(id: number, mediaType: MediaType): void {
    const current = this.getWatchlist()
    writeStorage(
      KEYS.watchlist,
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
    return readStorage<FavoriteItem>(KEYS.favorites)
  }

  addToFavorites(item: FavoriteItem): void {
    const current = this.getFavorites()
    const exists = current.some(
      (x) => x.id === item.id && x.media_type === item.media_type,
    )
    if (exists) return
    writeStorage(KEYS.favorites, [item, ...current])
  }

  removeFromFavorites(id: number, mediaType: MediaType): void {
    const current = this.getFavorites()
    writeStorage(
      KEYS.favorites,
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

  // ── Continue Watching ─────────────────────────────────────────────────────

  getContinueWatching(): ContinueWatchingItem[] {
    const items = readStorage<ContinueWatchingItem>(KEYS.continueWatching)
    // Sort by most recently opened
    return items.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
  }

  updateContinueWatching(item: ContinueWatchingItem): void {
    const current = this.getContinueWatching()
    const without = current.filter(
      (x) => !(x.id === item.id && x.media_type === item.media_type),
    )
    // Keep at most 20 items
    writeStorage(KEYS.continueWatching, [item, ...without].slice(0, 20))
  }

  removeFromContinueWatching(id: number, mediaType: MediaType): void {
    const current = this.getContinueWatching()
    writeStorage(
      KEYS.continueWatching,
      current.filter((x) => !(x.id === id && x.media_type === mediaType)),
    )
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────
// To migrate to Supabase: create SupabaseMediaStore implements UserMediaStore
// and swap this export.

export const store: UserMediaStore = new LocalStorageMediaStore()

// ── React hook helpers ────────────────────────────────────────────────────────

/**
 * Subscribe to storage events so tabs stay in sync.
 * Call in a useEffect; returns cleanup function.
 */
export function subscribeToStorageChanges(
  key: (typeof KEYS)[keyof typeof KEYS],
  onChange: () => void,
): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === key) onChange()
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
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
