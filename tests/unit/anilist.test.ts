import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AniListError } from '@/lib/anilist/client'
import { getAnimeDetail, getTrendingAnime } from '@/lib/anilist'

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

describe('AniList adapter', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('shapes a cached GraphQL list request and normalizes cards', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({
      data: {
        Page: {
          media: [{
            id: 101,
            title: { romaji: 'Signal', english: 'The Signal', native: '信号' },
            seasonYear: 2026,
            season: 'FALL',
            format: 'TV',
            status: 'RELEASING',
            episodes: 12,
            averageScore: 87,
            popularity: 1234,
            description: '<b>Transmission</b>',
            coverImage: { large: 'https://img.example/cover.jpg' },
            bannerImage: 'https://img.example/banner.jpg',
          }],
        },
      },
    }))

    const result = await getTrendingAnime()

    expect(result[0]).toMatchObject({
      source: 'anilist',
      sourceId: 101,
      kind: 'anime',
      title: 'The Signal',
      originalTitle: '信号',
      year: 2026,
      score: 8.7,
      posterUrl: 'https://img.example/cover.jpg',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      'https://graphql.anilist.co',
      expect.objectContaining({
        method: 'POST',
        next: { revalidate: 900 },
        body: expect.stringContaining('"page":1'),
      }),
    )
  })

  it('normalizes detail metadata, caps secondary people, and omits stale airing data', async () => {
    const now = Math.floor(Date.now() / 1000)
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response({
      data: {
        Media: {
          id: 202,
          title: { romaji: 'Detail', english: 'Detail', native: '詳細' },
          description: 'A transmission',
          genres: ['Mystery'],
          tags: [{ id: 1, name: 'Signal', rank: 80 }],
          studios: { nodes: [{ id: 4, name: 'Studio Signal' }], edges: [{ isMain: true }] },
          characters: { edges: Array.from({ length: 15 }, (_, id) => ({
            node: { id, name: { full: `Character ${id}` }, image: { large: null } },
            role: 'MAIN',
            voiceActors: [],
          })) },
          staff: { edges: Array.from({ length: 15 }, (_, id) => ({ node: { id, name: { full: `Staff ${id}` }, image: { large: null } }, roles: ['Director'] })) },
          relations: { edges: [{ relationType: 'SEQUEL', node: { id: 203, title: { romaji: 'Sequel', english: null, native: null }, type: 'ANIME', format: 'TV', coverImage: { large: null } } }] },
          recommendations: { nodes: [{ mediaRecommendation: { id: 204, title: { romaji: 'Recommended', english: null, native: null }, type: 'ANIME', format: 'MOVIE', coverImage: { large: null } } }] },
          nextAiringEpisode: { episode: 4, airingAt: now - 10 },
          trailer: { site: 'youtube', id: 'abc123', thumbnail: 'https://img.example/trailer.jpg' },
          externalLinks: [{ site: 'MYANIMELIST', id: 555 }],
        },
      },
    }))

    const result = await getAnimeDetail(202)

    expect(result.genres).toEqual(['Mystery'])
    expect(result.characters).toHaveLength(10)
    expect(result.staff).toHaveLength(10)
    expect(result.airing).toBeUndefined()
    expect(result.trailer).toEqual({ site: 'youtube', videoId: 'abc123', thumbnailUrl: 'https://img.example/trailer.jpg' })
    expect(result.externalIds).toEqual({ malId: 555 })
    expect(result.relations[0]).toMatchObject({ relation: 'SEQUEL', media: { sourceId: 203, kind: 'anime' } })
  })

  it('rejects malformed IDs before making an upstream request', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await expect(getAnimeDetail(0)).rejects.toMatchObject({ code: 'INVALID_ID' } satisfies Partial<AniListError>)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
