import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// provider-health is server-only; vitest's node environment is not.
vi.mock('server-only', () => ({}))

// Record every origin the health check actually probes.
const probedUrls: string[] = []
const originalFetch = globalThis.fetch

vi.mock('node:dns/promises', () => ({
  // Every hostname "resolves" so the probe proceeds to the reachability fetch.
  lookup: vi.fn(async () => [{ address: '203.0.113.1', family: 4 }]),
}))

beforeAll(() => {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    probedUrls.push(url)
    return new Response(null, { status: 200 })
  }) as unknown as typeof fetch
})

afterAll(() => {
  globalThis.fetch = originalFetch
})

function refreshRequest(ip?: string): Request {
  const headers = new Headers()
  if (ip) headers.set('x-vercel-forwarded-for', ip)
  return new Request('https://veyra.test/api/health/providers?refresh=1', { headers })
}

describe('health endpoint forced-refresh rate limiting', () => {
  beforeEach(async () => {
    const { resetRateLimitStore } = await import('@/lib/http/rate-limit')
    resetRateLimitStore()
    probedUrls.length = 0
  })

  it('returns 429 with Retry-After on the second forced refresh within 5 seconds', async () => {
    const { GET } = await import('@/app/api/health/providers/route')

    const first = await GET(refreshRequest())
    expect(first.status).toBe(200)
    const probesAfterFirst = probedUrls.length
    expect(probesAfterFirst).toBeGreaterThan(0)

    const second = await GET(refreshRequest())
    expect(second.status).toBe(429)
    expect(Number(second.headers.get('retry-after'))).toBeGreaterThan(0)

    // The rejected request must not have triggered another probe round.
    expect(probedUrls.length).toBe(probesAfterFirst)

    const body = (await second.json()) as { error: string }
    expect(body.error).toBeTruthy()
  })

  it('tracks the refresh limit per client IP, not with a global counter', async () => {
    const { GET } = await import('@/app/api/health/providers/route')

    expect((await GET(refreshRequest('198.51.100.1'))).status).toBe(200)
    expect((await GET(refreshRequest('198.51.100.1'))).status).toBe(429)
    // A different client IP still gets its own bucket.
    expect((await GET(refreshRequest('198.51.100.2'))).status).toBe(200)
    expect((await GET(refreshRequest('198.51.100.2'))).status).toBe(429)
  })

  it('serves non-forced calls from the 60s cache without re-probing', async () => {
    const { GET } = await import('@/app/api/health/providers/route')

    // Warm the cache (forced refresh is allowed as the first call for this IP).
    await GET(refreshRequest('203.0.113.10'))
    const warmed = probedUrls.length
    expect(warmed).toBeGreaterThan(0)

    // Every non-forced call must hit the cached results — no new probes.
    await GET(new Request('https://veyra.test/api/health/providers'))
    await GET(new Request('https://veyra.test/api/health/providers'))
    expect(probedUrls.length).toBe(warmed)
  })

  it('never reports or probes an origin supplied by the client', async () => {
    const { GET } = await import('@/app/api/health/providers/route')
    const { PROVIDERS } = await import('@/lib/player')

    const response = await GET(
      new Request('https://veyra.test/api/health/providers?origin=https://evil.example'),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { providers: Array<{ origin: string }> }

    // Every reported origin must come from the hardcoded registry.
    const registry = PROVIDERS.map((provider) => provider.origin)
    expect(body.providers.length).toBeGreaterThan(0)
    for (const provider of body.providers) {
      expect(registry).toContain(provider.origin)
    }
    expect(JSON.stringify(body)).not.toMatch(/evil\.example/)

    // Every actually-probed URL must be a registry origin.
    for (const probed of probedUrls) {
      expect(registry).toContain(probed)
      expect(probed).not.toMatch(/evil/)
    }
  })
})
