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

    it('preserves source-aware anime episodes in continue watching and history', () => {
      const episodeOne: ContinueWatchingItem = {
        id: 77,
        media_type: 'anime',
        source: 'anilist',
        sourceId: 77,
        kind: 'anime',
        title: 'Signal',
        season: 1,
        episode: 1,
        lastOpenedAt: 1000,
      }
      const episodeTwo = { ...episodeOne, episode: 2, lastOpenedAt: 2000 }

      store.updateContinueWatching(episodeOne)
      store.updateContinueWatching(episodeTwo)

      expect(store.getContinueWatching()).toHaveLength(2)
      expect(store.getHistory()).toEqual(expect.arrayContaining([
        expect.objectContaining({ source: 'anilist', sourceId: 77, kind: 'anime', episode: 1 }),
        expect.objectContaining({ source: 'anilist', sourceId: 77, kind: 'anime', episode: 2 }),
      ]))
    })
  })

  it('keeps the previous state when the single import commit fails', () => {
    store.addToWatchlist({ id: 1, media_type: 'movie', title: 'Keep', addedAt: 1 })
    const before = store.getWatchlist()
    const valid = JSON.parse(store.exportData()) as Record<string, unknown>
    valid.watchlist = []
    const originalSetItem = localStorage.setItem
    localStorage.setItem = ((key: string, value: string) => {
      if (key === 'veyra-library-snapshot') throw new Error('quota')
      return originalSetItem.call(localStorage, key, value)
    }) as Storage['setItem']

    const result = store.importData(JSON.stringify(valid))

    localStorage.setItem = originalSetItem
    expect(result).toMatchObject({ ok: false })
    expect(store.getWatchlist()).toEqual(before)
  })

  describe('Ratings operations', () => {
    it('sets, retrieves, and updates ratings', () => {
      expect(store.getRating(550, 'movie')).toBeNull()
      store.setRating(550, 'movie', 9)
      expect(store.getRating(550, 'movie')).toBe(9)

      // Update rating
      store.setRating(550, 'movie', 10)
      expect(store.getRating(550, 'movie')).toBe(10)
      expect(store.getRatings().length).toBe(1)
    })

    it('clamps ratings between 1 and 10', () => {
      store.setRating(100, 'movie', 15)
      expect(store.getRating(100, 'movie')).toBe(10)

      store.setRating(200, 'movie', -5)
      expect(store.getRating(200, 'movie')).toBe(1)
    })

    it('removes rating', () => {
      store.setRating(550, 'movie', 8)
      store.removeRating(550, 'movie')
      expect(store.getRating(550, 'movie')).toBeNull()
    })
  })
})
