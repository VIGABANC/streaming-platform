import { beforeEach, describe, expect, it } from 'vitest'
import { store, type WatchlistItem } from '@/lib/store'
import { sourceKey } from '@/lib/media/types'

const storage: Record<string, string> = {}
global.localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach((key) => delete storage[key]) },
  key: () => null,
  length: 0,
}

describe('anime library identity', () => {
  beforeEach(() => localStorage.clear())

  it('keeps an AniList anime separate from a TMDB movie with the same ID', () => {
    const movie: WatchlistItem = { id: 123, media_type: 'movie', title: 'Movie', addedAt: 1 }
    const anime: WatchlistItem = { id: 123, media_type: 'anime', title: 'Anime', addedAt: 2, source: 'anilist', sourceId: 123, kind: 'anime' }

    store.addToWatchlist(movie)
    store.addToWatchlist(anime)

    expect(store.getWatchlist()).toHaveLength(2)
    expect(sourceKey({ source: 'tmdb', sourceId: movie.id, kind: movie.media_type })).not.toBe(sourceKey({ source: 'anilist', sourceId: anime.sourceId!, kind: anime.kind! }))
  })
})
