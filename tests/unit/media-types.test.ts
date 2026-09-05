import { describe, expect, it } from 'vitest'
import { sourceKey, type MediaRef } from '@/lib/media/types'
import { libraryMediaHref } from '@/lib/media/library'

describe('source-aware media identity', () => {
  it('keeps equal numeric IDs from different sources distinct', () => {
    const tmdbMovie: MediaRef = { source: 'tmdb', sourceId: 123, kind: 'movie' }
    const anilistAnime: MediaRef = { source: 'anilist', sourceId: 123, kind: 'anime' }

    expect(sourceKey(tmdbMovie)).not.toBe(sourceKey(anilistAnime))
    expect(sourceKey(tmdbMovie)).toBe('tmdb:movie:123')
    expect(sourceKey(anilistAnime)).toBe('anilist:anime:123')
  })

  it('includes season and episode in episodic identity', () => {
    const anime: MediaRef = { source: 'anilist', sourceId: 123, kind: 'anime' }

    expect(sourceKey(anime, { season: 1, episode: 2 })).toBe('anilist:anime:123:s1:e2')
    expect(sourceKey(anime, { season: 1 })).toBe('anilist:anime:123:s1')
  })

  it('routes library records to their source-aware detail pages', () => {
    expect(libraryMediaHref({ id: 7, media_type: 'movie' })).toBe('/movie/7')
    expect(libraryMediaHref({ id: 7, media_type: 'tv' })).toBe('/tv/7')
    expect(libraryMediaHref({ id: 7, media_type: 'anime', sourceId: 99 })).toBe('/anime/99')
  })
})
