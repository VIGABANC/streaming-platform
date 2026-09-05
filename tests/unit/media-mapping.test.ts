import { describe, expect, it } from 'vitest'
import { mapAnimeToTmdb, type TmdbMappingCandidate } from '@/lib/media/mapping'
import type { AnimeListItem } from '@/lib/anilist'

const anime: AnimeListItem = {
  source: 'anilist',
  sourceId: 101,
  kind: 'anime',
  title: 'The Signal',
  originalTitle: '信号',
  year: 2026,
  format: 'TV',
}

describe('conservative AniList to TMDB mapping', () => {
  it('prefers a verified external id as a high-confidence mapping', () => {
    const candidate: TmdbMappingCandidate = { id: 900, media_type: 'tv', name: 'Unrelated' }

    expect(mapAnimeToTmdb(anime, [candidate], { tmdbId: 900, tmdbKind: 'tv' })).toMatchObject({
      anilistId: 101,
      tmdbId: 900,
      tmdbKind: 'tv',
      confidence: 'high',
      matchedBy: 'external-id',
    })
  })

  it('requires matching title, year, and format for a high-confidence guess', () => {
    const candidate: TmdbMappingCandidate = { id: 901, media_type: 'tv', name: 'The Signal', first_air_date: '2026-10-01' }
    expect(mapAnimeToTmdb(anime, [candidate])).toMatchObject({ confidence: 'high', matchedBy: 'title-year', tmdbId: 901 })
  })

  it('does not map ambiguous or mismatched candidates', () => {
    const candidates: TmdbMappingCandidate[] = [
      { id: 902, media_type: 'tv', name: 'The Signal', first_air_date: '2025-01-01' },
      { id: 903, media_type: 'movie', title: 'The Signal', release_date: '2026-01-01' },
    ]
    expect(mapAnimeToTmdb(anime, candidates)).toBeNull()
  })
})
