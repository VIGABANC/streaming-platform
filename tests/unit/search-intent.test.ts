import { describe, expect, it } from 'vitest'
import { parseSearchIntent } from '@/lib/search-intent'

describe('language-aware search intent', () => {
  it('extracts language and year while preserving the query', () => {
    expect(parseSearchIntent('malayalam thriller 2025')).toEqual({
      query: 'thriller', language: 'Malayalam', year: 2025,
    })
  })

  it('recognizes media type and dub/sub modifiers', () => {
    expect(parseSearchIntent('korean drama dubbed anime')).toEqual({
      query: 'drama anime', language: 'Korean', mediaType: 'tv', audioPreference: 'dubbed',
    })
    expect(parseSearchIntent('japanese sub movie')).toEqual({
      query: '', language: 'Japanese', mediaType: 'movie', subtitlePreference: 'subbed',
    })
  })

  it('handles aliases and leaves unknown words untouched', () => {
    expect(parseSearchIntent('new hindi comedy')).toEqual({
      query: 'new comedy', language: 'Hindi',
    })
  })
})
