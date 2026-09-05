import { describe, expect, it } from 'vitest'
import { normalizeAnimeSearchResult, normalizeTmdbSearchResult } from '@/lib/search/normalize'

describe('source-aware search normalization', () => {
  it('preserves TMDB movie and TV links and excludes people', () => {
    expect(normalizeTmdbSearchResult({ id: 1, media_type: 'movie', title: 'Film', release_date: '2026-01-01' })).toMatchObject({
      ref: { source: 'tmdb', sourceId: 1, kind: 'movie' },
      title: 'Film',
      year: 2026,
    })
    expect(normalizeTmdbSearchResult({ id: 2, media_type: 'person', name: 'Person' })).toBeNull()
  })

  it('normalizes AniList results without adding per-result enrichment', () => {
    expect(normalizeAnimeSearchResult({ source: 'anilist', sourceId: 3, kind: 'anime', title: 'Anime', year: 2025, posterUrl: 'https://s4.anilist.co/poster.jpg' })).toMatchObject({
      ref: { source: 'anilist', sourceId: 3, kind: 'anime' },
      title: 'Anime',
      posterUrl: 'https://s4.anilist.co/poster.jpg',
    })
  })
})
