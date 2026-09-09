import { afterEach, describe, expect, it, vi } from 'vitest'
import { getJikanEnrichment } from '@/lib/jikan/client'
import { getWatchmodeLinks } from '@/lib/watchmode/client'

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const watchmodeInput = (tmdbId: number) => ({
  tmdbId,
  mediaType: 'movie' as const,
  region: 'US',
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('Jikan detail enrichment', () => {
  it('normalizes MAL detail metrics and requests the full detail endpoint with a one-day cache', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          mal_id: 5114,
          score: 9.1,
          rank: 1,
          popularity: 3,
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getJikanEnrichment(5114)).resolves.toEqual({
      score: 9.1,
      rank: 1,
      popularity: 3,
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.jikan.moe/v4/anime/5114/full',
      expect.objectContaining({ next: { revalidate: 86400 } }),
    )
  })

  it('does not request Jikan for a non-positive MAL id', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getJikanEnrichment(0)).resolves.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns null when Jikan responds with an error or malformed JSON', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'not found' }, 404))
      .mockResolvedValueOnce(new Response('{not-json', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getJikanEnrichment(404)).resolves.toBeNull()
    await expect(getJikanEnrichment(405)).resolves.toBeNull()
  })

  it('returns null and aborts the request when Jikan exceeds the bounded timeout', async () => {
    vi.useFakeTimers()
    let signal: AbortSignal | undefined
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      signal = init?.signal as AbortSignal | undefined
      return new Promise<Response>(() => {})
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = getJikanEnrichment(999)
    await vi.advanceTimersByTimeAsync(5000)

    await expect(result).resolves.toBeNull()
    expect(signal?.aborted).toBe(true)
  })
})

describe('Watchmode provider-link enrichment', () => {
  it('returns a typed disabled result without requesting when the server key is absent', async () => {
    vi.stubEnv('WATCHMODE_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getWatchmodeLinks(watchmodeInput(278))).resolves.toEqual({
      status: 'disabled',
      links: [],
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('normalizes source destinations and keeps the API key in a server request header', async () => {
    vi.stubEnv('WATCHMODE_API_KEY', 'server-secret')
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          source_id: 203,
          name: 'Netflix',
          type: 'sub',
          region: 'US',
          web_url: 'https://www.netflix.com/title/123',
          ios_url: 'https://example.test/ios',
          android_url: 'https://example.test/android',
        },
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(getWatchmodeLinks(watchmodeInput(278))).resolves.toEqual({
      status: 'success',
      links: [
        {
          providerId: 203,
          name: 'Netflix',
          type: 'sub',
          url: 'https://www.netflix.com/title/123',
        },
      ],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.watchmode.com/v1/title/movie-278/sources/?regions=US',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'server-secret' }),
        next: { revalidate: 21600 },
      }),
    )
  })

  it.each([
    ['an unauthorized response', jsonResponse({}, 401), 401],
    ['a quota response', jsonResponse({}, 429), 429],
    ['a network failure', new TypeError('socket closed'), 500],
  ])('returns unavailable for %s without exposing provider details', async (_label, outcome, id) => {
    vi.stubEnv('WATCHMODE_API_KEY', 'server-secret')
    const fetchMock = vi.fn().mockImplementation(() =>
      outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await getWatchmodeLinks(watchmodeInput(id))

    expect(result).toEqual({ status: 'unavailable', links: [] })
    expect(JSON.stringify(result)).not.toContain('server-secret')
  })
})
