import { afterEach, expect, it, vi } from 'vitest'
import { getAnimeDetail } from '@/lib/jikan/client'

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
