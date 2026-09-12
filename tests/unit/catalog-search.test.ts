import { describe, expect, it } from 'vitest'
import { dedupeSearchResults, rankSearchResults, type SearchCatalogItem } from '@/lib/catalog-search'

const result = (input: Partial<Omit<SearchCatalogItem, 'alternativeTitles'>> & Pick<SearchCatalogItem, 'id' | 'title' | 'media_type'>): SearchCatalogItem => ({
  source: 'tmdb',
  sourceId: String(input.id),
  canonicalId: `tmdb:${input.media_type}:${input.id}`,
  overview: '',
  poster_path: null,
  backdrop_path: null,
  vote_average: 0,
  release_date: '',
  alternativeTitles: [],
  attribution: 'TMDB',
  ...input,
})

describe('catalog search', () => {
  it('ranks exact title matches before partial matches', () => {
    const items = [result({ id: 2, title: 'The Cowboy Bebop Movie', media_type: 'movie' }), result({ id: 1, title: 'Cowboy Bebop', media_type: 'anime' })]
    expect(rankSearchResults(items, 'cowboy bebop')[0].id).toBe(1)
  })

  it('deduplicates by canonical identity while preserving distinct media types', () => {
    const items = [
      result({ id: 1, title: 'One Piece', media_type: 'tv' }),
      result({ id: 1, title: 'One Piece', media_type: 'tv' }),
      result({ id: 1, title: 'One Piece', media_type: 'anime' }),
    ]
    expect(dedupeSearchResults(items)).toHaveLength(2)
  })
})
