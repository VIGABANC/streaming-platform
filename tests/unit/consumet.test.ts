import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Server-only modules and the DNS dependency are mocked; every Consumet
// response is stubbed — tests never hit a real instance.
vi.mock('server-only', () => ({}))

const { dnsLookupMock } = vi.hoisted(() => ({ dnsLookupMock: vi.fn() }))
vi.mock('node:dns/promises', () => ({
  lookup: dnsLookupMock,
}))

const ORIGINAL_CONSUMET_BASE_URL = process.env.CONSUMET_BASE_URL
const fetchMock = vi.fn()
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function request(ip: string): Request {
  const headers = new Headers()
  headers.set('x-vercel-forwarded-for', ip)
  return new Request(`https://veyra.test/api/health/providers?refresh=1`, { headers })
}

function probedUrls(): string[] {
  return fetchMock.mock.calls.map((call) => {
    const input = call[0] as RequestInfo | URL
    return typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  })
}

beforeEach(() => {
  fetchMock.mockReset()
  dnsLookupMock.mockReset()
  dnsLookupMock.mockResolvedValue([{ address: '203.0.113.7', family: 4 }])
  fetchMock.mockImplementation(async () => json({ results: [{ id: 'probe' }] }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  if (ORIGINAL_CONSUMET_BASE_URL === undefined) delete process.env.CONSUMET_BASE_URL
  else process.env.CONSUMET_BASE_URL = ORIGINAL_CONSUMET_BASE_URL
})

describe('consumet configuration', () => {
  it('treats an unset or malformed base URL as unconfigured', async () => {
    const { getConsumetConfig } = await import('@/lib/providers/consumet')

    delete process.env.CONSUMET_BASE_URL
    expect(getConsumetConfig()).toBeNull()

    process.env.CONSUMET_BASE_URL = '   '
    expect(getConsumetConfig()).toBeNull()

    process.env.CONSUMET_BASE_URL = 'ftp://consumet.example.test'
    expect(getConsumetConfig()).toBeNull()
  })

  it('never adds Consumet to the movie/TV provider registry', async () => {
    const { PROVIDERS, CONSUMET_PROVIDER } = await import('@/lib/player')

    expect(PROVIDERS).toHaveLength(4)
    expect(PROVIDERS.some((provider) => provider.supportedMediaTypes.includes('anime'))).toBe(false)
    expect(PROVIDERS.map((provider) => provider.id)).not.toContain('consumet')
    expect(CONSUMET_PROVIDER.supportedMediaTypes).toEqual(['anime'])
  })
})

describe('anime playback resolution', () => {
  it('keeps the unconfigured state when CONSUMET_BASE_URL is unset and never probes', async () => {
    delete process.env.CONSUMET_BASE_URL
    const { resolveAnimePlayback } = await import('@/lib/anime-playback')

    const resolution = await resolveAnimePlayback({ malId: 1, episodeNumber: 1, forceHealth: true })

    expect(resolution.status).toBe('unconfigured')
    expect(resolution.health.configured).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resolves a native video source when the instance is configured and healthy', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/anime/mal/info?id=1')) {
        return json({ episodes: [
          { id: 'ep-1', number: 1, title: 'Episode 1' },
          { id: 'ep-2', number: 2, title: 'Episode 2' },
        ] })
      }
      if (url.includes('/anime/mal/watch/ep-1')) {
        return json({
          headers: { Referer: 'https://gogo.example.test' },
          sources: [
            { url: 'https://cdn.example.test/ep-1.m3u8', quality: 'auto', isM3U8: true },
            { url: 'https://cdn.example.test/ep-1.mp4', quality: '720p', isM3U8: false },
          ],
          subtitles: [{ url: 'https://cdn.example.test/ep-1.vtt', lang: 'english' }],
        })
      }
      return json({ results: [{ id: 'probe' }] })
    })

    const { resolveAnimePlayback } = await import('@/lib/anime-playback')
    const { resolvePlaybackSources } = await import('@/lib/playback-resolver')

    const resolution = await resolveAnimePlayback({ malId: 1, episodeNumber: 1, forceHealth: true })

    expect(resolution.status).toBe('ready')
    expect(resolution.source?.mode).toBe('native-media')
    expect(resolution.source?.mediaType).toBe('anime')
    expect(resolution.source?.url).toBe('https://cdn.example.test/ep-1.mp4')
    expect(resolution.source?.subtitles).toHaveLength(1)

    // The resolver chain accepts the source for the anime request only.
    const resolved = resolvePlaybackSources({
      mediaType: 'anime',
      mediaId: 1,
      episode: 1,
      nativeSources: resolution.source ? [resolution.source] : [],
    })
    expect(resolved.status).toBe('success')
    expect(resolved.sources[0].mode).toBe('native-media')
    expect(resolved.sources[0].url).toBe('https://cdn.example.test/ep-1.mp4')

    // Movie/TV requests must never adopt the anime source.
    const movieResolved = resolvePlaybackSources({ mediaType: 'movie', mediaId: 1, nativeSources: resolution.source ? [resolution.source] : [] })
    expect(movieResolved.sources.some((source) => source.providerId === 'consumet')).toBe(false)
  })

  it('reports the provider unavailable when DNS fails and renders no video', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    dnsLookupMock.mockRejectedValue(new Error('ENOTFOUND'))

    const { resolveAnimePlayback } = await import('@/lib/anime-playback')
    const resolution = await resolveAnimePlayback({ malId: 1, episodeNumber: 1, forceHealth: true })

    expect(resolution.status).toBe('provider-unavailable')
    expect(resolution.health.dnsResolved).toBe(false)
    // A DNS failure must not trigger a reachability probe or any episode fetch.
    expect(fetchMock).not.toHaveBeenCalled()
    expect(resolution.source).toBeUndefined()
  })

  it('reports the provider unavailable when the instance is unreachable', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url === 'https://consumet.example.test/anime/gogoanime/top-airing') throw new Error('network down')
      return json({ results: [{ id: 'probe' }] })
    })

    const { resolveAnimePlayback } = await import('@/lib/anime-playback')
    const resolution = await resolveAnimePlayback({ malId: 1, episodeNumber: 1, forceHealth: true })

    expect(resolution.status).toBe('provider-unavailable')
    expect(resolution.source).toBeUndefined()
  })

  it('reports episode unavailable when the episode is missing or the anime is not on the provider', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/anime/mal/info?id=1')) {
        return json({ episodes: [{ id: 'ep-1', number: 1 }] })
      }
      return json({ results: [{ id: 'probe' }] })
    })

    const { resolveAnimePlayback } = await import('@/lib/anime-playback')

    const missingEpisode = await resolveAnimePlayback({ malId: 1, episodeNumber: 5, forceHealth: true })
    expect(missingEpisode.status).toBe('episode-unavailable')

    // 404 from the instance: the anime is not present on this provider.
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/anime/mal/info?id=1')) return new Response('Not found', { status: 404 })
      return json({ results: [{ id: 'probe' }] })
    })
    const notFound = await resolveAnimePlayback({ malId: 1, episodeNumber: 1, forceHealth: true })
    expect(notFound.status).toBe('episode-unavailable')
  })

  it('probes only the configured instance and falls back to no public endpoint', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/anime/mal/info?id=1')) return json({ episodes: [{ id: 'ep-1', number: 1 }] })
      if (url.includes('/anime/mal/watch/ep-1')) {
        return json({ sources: [{ url: 'https://cdn.example.test/ep-1.mp4', isM3U8: false }], subtitles: [] })
      }
      return json({ results: [{ id: 'probe' }] })
    })

    const { resolveAnimePlayback } = await import('@/lib/anime-playback')
    const resolution = await resolveAnimePlayback({ malId: 1, episodeNumber: 1, forceHealth: true })

    expect(resolution.status).toBe('ready')
    for (const probed of probedUrls()) {
      expect(probed.startsWith('https://consumet.example.test/')).toBe(true)
    }
  })

  it('drops non-HTTPS stream URLs instead of rendering a broken player', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url.includes('/anime/mal/info?id=1')) return json({ episodes: [{ id: 'ep-1', number: 1 }] })
      if (url.includes('/anime/mal/watch/ep-1')) {
        return json({ sources: [{ url: 'http://cdn.example.test/ep-1.mp4', isM3U8: false }], subtitles: [] })
      }
      return json({ results: [{ id: 'probe' }] })
    })

    const { resolveAnimePlayback } = await import('@/lib/anime-playback')
    const resolution = await resolveAnimePlayback({ malId: 1, episodeNumber: 1, forceHealth: true })
    expect(resolution.status).toBe('episode-unavailable')
  })
})

describe('consumet health endpoint', () => {
  it('returns { configured: false } without probing when unconfigured', async () => {
    delete process.env.CONSUMET_BASE_URL
    const { GET } = await import('@/app/api/health/providers/route')

    const response = await GET(request('203.0.113.10'))
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      providers: Array<{ id: string }>
      consumet: { configured: boolean; dnsResolved?: boolean; latencyMs?: number | null }
    }

    expect(body.consumet.configured).toBe(false)
    expect(body.consumet.dnsResolved).toBe(false)
    expect(body.consumet.latencyMs).toBe(null)
    // Only the hardcoded movie/TV registry origins were probed.
    const { PROVIDERS } = await import('@/lib/player')
    const registryOrigins = PROVIDERS.map((provider) => provider.origin)
    for (const probed of probedUrls()) expect(registryOrigins).toContain(probed)
    expect(body.providers.some((provider) => provider.id === 'consumet')).toBe(false)
  })

  it('reports the same dns/reachable/latency shape when configured', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    const { GET } = await import('@/app/api/health/providers/route')

    const response = await GET(request('203.0.113.11'))
    expect(response.status).toBe(200)
    const body = (await response.json()) as {
      consumet: {
        configured: boolean
        id: string
        name: string
        origin: string | null
        dnsResolved: boolean
        reachable: boolean
        status: string | null
        latencyMs: number | null
        lastCheckedAt: string
        error: string | null
      }
    }

    expect(body.consumet.configured).toBe(true)
    expect(body.consumet.id).toBe('consumet')
    expect(body.consumet.origin).toBe('https://consumet.example.test')
    expect(body.consumet.dnsResolved).toBe(true)
    expect(body.consumet.reachable).toBe(true)
    expect(body.consumet.status).toBe('healthy')
    expect(typeof body.consumet.latencyMs).toBe('number')
    expect(typeof body.consumet.lastCheckedAt).toBe('string')
    expect(body.consumet.error).toBe(null)
  })

  it('reports a DNS failure for a configured instance that does not resolve', async () => {
    process.env.CONSUMET_BASE_URL = 'https://consumet.example.test'
    dnsLookupMock.mockRejectedValue(new Error('ENOTFOUND'))
    const { GET } = await import('@/app/api/health/providers/route')

    const response = await GET(request('203.0.113.12'))
    expect(response.status).toBe(200)
    const body = (await response.json()) as { consumet: { configured: boolean; dnsResolved: boolean; status: string | null } }

    expect(body.consumet.configured).toBe(true)
    expect(body.consumet.dnsResolved).toBe(false)
    expect(body.consumet.status).toBe('dns-failure')
  })
})
