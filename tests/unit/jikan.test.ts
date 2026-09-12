import { describe, expect, it } from 'vitest'
import { getAnimeEpisodes, JikanError, mapJikanEpisode } from '@/lib/jikan'

describe('Jikan episode adapter', () => {
  it('maps real episode metadata without inventing titles', () => {
    expect(mapJikanEpisode({
      mal_id: 1,
      title: 'Asteroid Blues',
      synopsis: 'A bounty hunt begins.',
      aired: '1998-04-03T00:00:00+00:00',
      duration: 24,
      images: { jpg: { image_url: 'https://cdn.example/episode.jpg' } },
    })).toEqual({
      id: 1,
      number: 1,
      title: 'Asteroid Blues',
      overview: 'A bounty hunt begins.',
      airDate: '1998-04-03T00:00:00+00:00',
      duration: 24,
      imageUrl: 'https://cdn.example/episode.jpg',
    })
  })

  it('keeps an unavailable episode endpoint distinguishable from an empty catalog', async () => {
    const fetcher = async () => new Response('', { status: 503 })
    await expect(getAnimeEpisodes(1, fetcher)).rejects.toMatchObject({
      code: 'JIKAN_REQUEST_FAILED',
      name: 'JikanError',
    } satisfies Partial<JikanError>)
  })
})
