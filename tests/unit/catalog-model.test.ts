import { describe, expect, it } from 'vitest'
import { canonicalMediaId, normalizeTitles, type CatalogMediaItem } from '@/lib/catalog-model'

describe('normalized catalog model', () => {
  it('keeps source identity in canonical ids', () => {
    expect(canonicalMediaId({ source: 'tmdb', media_type: 'movie', id: 42 })).toBe('tmdb:movie:42')
    expect(canonicalMediaId({ source: 'anilist', media_type: 'anime', id: 42 })).toBe('anilist:anime:42')
  })

  it('normalizes preferred, original, and alternative titles without duplicates', () => {
    expect(normalizeTitles({
      preferred: 'Cowboy Bebop',
      original: 'カウボーイビバップ',
      alternatives: ['Cowboy Bebop', 'Cowboy Bebop (TV)'],
    })).toEqual(['Cowboy Bebop', 'カウボーイビバップ', 'Cowboy Bebop (TV)'])
  })

  it('represents anime as a media item that remains compatible with card data', () => {
    const item: CatalogMediaItem = {
      id: 1,
      source: 'anilist',
      sourceId: '1',
      canonicalId: 'anilist:anime:1',
      media_type: 'anime',
      title: 'Cowboy Bebop',
      originalTitle: 'カウボーイビバップ',
      alternativeTitles: [],
      overview: 'A space western.',
      posterUrl: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/example.jpg',
      backdropUrl: null,
      vote_average: 8.9,
      release_date: '1998-04-03',
      original_language: 'ja',
      genres: ['Action'],
      status: 'FINISHED',
      format: 'TV',
      episodes: 26,
      duration: 24,
      studios: ['Sunrise'],
      attribution: 'AniList',
    }

    expect(item.media_type).toBe('anime')
    expect(item.canonicalId).toBe('anilist:anime:1')
  })
})
