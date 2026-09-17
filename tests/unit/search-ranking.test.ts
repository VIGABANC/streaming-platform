import { describe, expect, it } from 'vitest'
import { rankSearchResults } from '@/lib/search-ranking'
import type { Media } from '@/lib/tmdb'

const movie = (value: Partial<Media>): Media => ({ id: 1, media_type: 'movie', title: 'Untitled', ...value })

describe('deterministic search ranking', () => {
  it('ranks an exact title above a more popular loose match', () => {
    const result = rankSearchResults([
      movie({ id: 2, title: 'Dune: Part Two', popularity: 999 }),
      movie({ id: 1, title: 'Dune', popularity: 10 }),
    ], { query: 'dune' })
    expect(result.map((item) => item.id)).toEqual([1, 2])
  })

  it('rewards language, year, and media-type intent', () => {
    const result = rankSearchResults([
      movie({ id: 1, title: 'Parasite', original_language: 'en', release_date: '2019-01-01', media_type: 'movie' }),
      movie({ id: 2, title: 'Parasite', original_language: 'ko', release_date: '2019-05-01', media_type: 'movie' }),
    ], { query: 'parasite', language: 'Korean', year: 2019, mediaType: 'movie' })
    expect(result[0].id).toBe(2)
  })
})
