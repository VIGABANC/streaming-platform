import { afterEach, expect, it, vi } from 'vitest'
import { getAnimeDetail, getAnimeEpisodes } from '@/lib/jikan/client'

afterEach(() => vi.unstubAllGlobals())
const respond = (data: unknown) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data }))))

it('rejects metadata for a different catalog identifier', async () => {
  respond({ mal_id: 2, title: 'Another anime' })
  await expect(getAnimeDetail(1)).resolves.toBeNull()
})

it('keeps useful metadata when optional fields are malformed', async () => {
  respond({ mal_id: 1, title: 'Cowboy Bebop', episodes: -1, genres: [null, { name: 'Action' }], images: { jpg: { image_url: 'javascript:alert(1)' } } })
  await expect(getAnimeDetail(1)).resolves.toMatchObject({ id: 1, title: 'Cowboy Bebop', episodes: null, image: null, genres: ['Action'] })
})

it('accepts a valid catalog poster and episode count', async () => {
  respond({ mal_id: 1, title: 'Cowboy Bebop', episodes: 26, images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/anime/4/19644.jpg' } } })
  await expect(getAnimeDetail(1)).resolves.toMatchObject({ id: 1, episodes: 26, image: 'https://cdn.myanimelist.net/images/anime/4/19644.jpg' })
})

it('keeps all metadata episodes when Consumet is unverified', async () => {
  delete process.env.CONSUMET_BASE_URL
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    data: [
      { mal_id: 1, title: "The Journey's End", aired: { from: '2023-09-29T00:00:00+00:00' } },
      { mal_id: 2, title: 'It Was a Trade', aired: { from: '2023-10-06T00:00:00+00:00' } },
      { mal_id: 3, title: 'Killing Magic', aired: { from: '2023-10-13T00:00:00+00:00' } },
    ],
  }))))

  await expect(getAnimeEpisodes(52991)).resolves.toHaveLength(3)
})
