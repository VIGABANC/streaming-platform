import { describe, it, expect, beforeEach } from 'vitest'
import { store, type WatchlistItem, type FavoriteItem, type ContinueWatchingItem } from '@/lib/store'

// Mock in-memory localStorage for Node environment
const mockStorage: Record<string, string> = {}
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => {
    mockStorage[key] = value
  },
  removeItem: (key: string) => {
    delete mockStorage[key]
  },
  clear: () => {
    for (const key in mockStorage) delete mockStorage[key]
  },
  key: () => null,
  length: 0,
}

describe('UserMediaStore (LocalStorage abstraction)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Watchlist operations', () => {
    const movieItem: WatchlistItem = {
      id: 550,
      title: 'Fight Club',
      media_type: 'movie',
      addedAt: Date.now(),
    }

    it('adds and retrieves items in watchlist', () => {
      expect(store.getWatchlist()).toEqual([])
      store.addToWatchlist(movieItem)
      expect(store.isInWatchlist(550, 'movie')).toBe(true)
      expect(store.getWatchlist().length).toBe(1)
    })

    it('prevents duplicate additions of identical media id + type', () => {
      store.addToWatchlist(movieItem)
      store.addToWatchlist(movieItem)
      expect(store.getWatchlist().length).toBe(1)
    })

    it('removes item from watchlist', () => {
      store.addToWatchlist(movieItem)
      store.removeFromWatchlist(550, 'movie')
      expect(store.isInWatchlist(550, 'movie')).toBe(false)
      expect(store.getWatchlist()).toEqual([])
    })

    it('toggles watchlist state on and off', () => {
      store.toggleWatchlist(movieItem)
      expect(store.isInWatchlist(550, 'movie')).toBe(true)
      store.toggleWatchlist(movieItem)
      expect(store.isInWatchlist(550, 'movie')).toBe(false)
    })
  })

  describe('Favorites operations', () => {
    const favItem: FavoriteItem = {
      id: 1399,
      name: 'Game of Thrones',
      media_type: 'tv',
      addedAt: Date.now(),
      favoritedAt: Date.now(),
    }

    it('adds and removes favorites independently', () => {
      store.addToFavorites(favItem)
      expect(store.isInFavorites(1399, 'tv')).toBe(true)
      store.removeFromFavorites(1399, 'tv')
      expect(store.isInFavorites(1399, 'tv')).toBe(false)
    })
  })

  describe('Continue Watching operations', () => {
    it('stores and sorts continue watching entries by latest opened timestamp', () => {
      const olderItem: ContinueWatchingItem = {
        id: 100,
        media_type: 'movie',
        title: 'Older Movie',
        lastOpenedAt: 1000,
      }
      const newerItem: ContinueWatchingItem = {
        id: 200,
        media_type: 'tv',
        title: 'Newer Show',
        season: 1,
        episode: 2,
        lastOpenedAt: 2000,
      }

      store.updateContinueWatching(olderItem)
      store.updateContinueWatching(newerItem)

      const history = store.getContinueWatching()
      expect(history.length).toBe(2)
      expect(history[0].id).toBe(200) // Most recent first
      expect(history[1].id).toBe(100)
    })
  })
})
