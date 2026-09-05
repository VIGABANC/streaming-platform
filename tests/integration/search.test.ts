import { beforeEach, describe, expect, it, vi } from 'vitest'

const { tmdbSearch, animeSearch } = vi.hoisted(() => ({ tmdbSearch: vi.fn(), animeSearch: vi.fn() }))

vi.mock('@/lib/tmdb', () => ({
  searchMulti: tmdbSearch,
  TMDBError: class TMDBError extends Error { code = 'TMDB_REQUEST_FAILED' },
}))
vi.mock('@/lib/anilist', () => ({
  searchAnime: animeSearch,
  AniListError: class AniListError extends Error { code = 'UPSTREAM_ERROR' },
}))

import { GET } from '@/app/api/search/route'

describe('unified search route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('validates scope before making upstream requests', async () => {
    const result = await GET(new Request('https://veyra.test/api/search?query=Signal&scope=invalid'))
    expect(result.status).toBe(400)
    expect(tmdbSearch).not.toHaveBeenCalled()
    expect(animeSearch).not.toHaveBeenCalled()
  })

  it('calls only AniList for the anime scope', async () => {
    animeSearch.mockResolvedValue([{ source: 'anilist', sourceId: 10, kind: 'anime', title: 'Signal' }])
    const result = await GET(new Request('https://veyra.test/api/search?query=Signal&scope=anime'))
    expect(result.status).toBe(200)
    expect(tmdbSearch).not.toHaveBeenCalled()
    expect(animeSearch).toHaveBeenCalledWith('Signal')
    expect(await result.json()).toMatchObject({ results: [{ ref: { source: 'anilist', sourceId: 10, kind: 'anime' } }] })
  })

  it('keeps TMDB results when AniList is unavailable in all-scope search', async () => {
    tmdbSearch.mockResolvedValue({ results: [{ id: 20, media_type: 'movie', title: 'Film', release_date: '2026-01-01' }] })
    animeSearch.mockRejectedValue(new Error('unavailable'))
    const result = await GET(new Request('https://veyra.test/api/search?query=Signal&scope=all'))
    expect(result.status).toBe(200)
    expect(await result.json()).toMatchObject({ results: [{ ref: { source: 'tmdb', sourceId: 20, kind: 'movie' } }], failures: ['SEARCH_UPSTREAM_UNAVAILABLE'] })
  })
})
