import { describe, it, expect } from 'vitest'
import type { Media, MediaType } from '@/lib/tmdb'

function normalizeSearchResults(
  rawResults: Array<{ id: number; title?: string; name?: string; media_type?: string }>,
): (Media & { media_type: MediaType })[] {
  return rawResults
    .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
    .map((item) => ({
      ...item,
      media_type: item.media_type as MediaType,
    }))
}

describe('Search Multi-Type Integration & Filtering', () => {
  it('filters out person entries and preserves movie and tv', () => {
    const mockTMDBMulti = [
      { id: 1, title: 'Spider-Man', media_type: 'movie' },
      { id: 2, name: 'Spider-Man: The Animated Series', media_type: 'tv' },
      { id: 3, name: 'Tom Holland', media_type: 'person' },
      { id: 4, name: 'Zendaya', media_type: 'person' },
      { id: 5, title: 'Spider-Man: Across the Spider-Verse', media_type: 'movie' },
    ]

    const normalized = normalizeSearchResults(mockTMDBMulti)
    expect(normalized.length).toBe(3)
    expect(normalized.map((n) => n.media_type)).toEqual(['movie', 'tv', 'movie'])
  })

  it('handles empty response gracefully without throwing', () => {
    const normalized = normalizeSearchResults([])
    expect(normalized).toEqual([])
  })
})
