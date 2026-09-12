import { describe, expect, it } from 'vitest'
import { AniListError, mapAniListAnime, searchAnime } from '@/lib/anilist'

const sample = {
  id: 1,
  title: {
    romaji: 'Cowboy Bebop',
    english: 'Cowboy Bebop',
    native: 'カウボーイビバップ',
    userPreferred: 'Cowboy Bebop',
  },
  synonyms: ['Cowboy Bebop (TV)'],
  description: 'A space western.',
  coverImage: { large: 'https://s4.anilist.co/example.jpg' },
  bannerImage: 'https://s4.anilist.co/banner.jpg',
  averageScore: 89,
  startDate: { year: 1998, month: 4, day: 3 },
  endDate: { year: 1999, month: 4, day: 24 },
  format: 'TV',
  status: 'FINISHED',
  episodes: 26,
  duration: 24,
  genres: ['Action', 'Sci-Fi'],
  studios: { nodes: [{ id: 1, name: 'Sunrise', isAnimationStudio: true }] },
  nextAiringEpisode: null,
  relations: { edges: [] },
  recommendations: { nodes: [] },
}

describe('AniList adapter', () => {
  it('maps AniList data into VEYRA anime data', () => {
    const item = mapAniListAnime(sample)
    expect(item).toMatchObject({
      id: 1,
      media_type: 'anime',
      title: 'Cowboy Bebop',
      originalTitle: 'カウボーイビバップ',
      alternativeTitles: ['Cowboy Bebop (TV)'],
      vote_average: 8.9,
      release_date: '1998-04-03',
      studios: ['Sunrise'],
    })
  })

  it('maps an AniList GraphQL error to a stable error', async () => {
    const fetcher = async () => new Response(JSON.stringify({ errors: [{ message: 'busy' }] }), { status: 200 })
    await expect(searchAnime({ query: 'bebop' }, fetcher)).rejects.toBeInstanceOf(AniListError)
  })
})
