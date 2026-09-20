import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

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

describe('provider health endpoint safety', () => {
  it('probes only the hardcoded provider registry and rejects attacker-supplied origins', async () => {
    const { GET } = await import('@/app/api/health/providers/route')
    const { PROVIDERS } = await import('@/lib/player')

    const allowlistedOrigins = PROVIDERS.map((provider) => provider.origin)
    expect(allowlistedOrigins.every((origin) => origin.startsWith('https://'))).toBe(true)

    // Attacker-controlled input via query params and headers must not redirect probes.
    const maliciousUrl = 'https://app.test/api/health/providers?origin=https://evil.example&url=https://evil2.example&host=evil3.example'
    const request = new Request(maliciousUrl, {
      method: 'GET',
      headers: {
        'x-provider-origin': 'https://evil4.example',
        'x-forwarded-host': 'evil5.example',
        origin: 'https://evil6.example',
      },
    })

    const response = await GET(request)
    expect(response.status).toBe(200)
    const body = (await response.json()) as { providers: Array<{ origin: string }> }

    // Every reported origin must come from the hardcoded registry.
    expect(body.providers.length).toBeGreaterThan(0)
    for (const provider of body.providers) {
      expect(allowlistedOrigins).toContain(provider.origin)
      expect(provider.origin).not.toMatch(/evil/)
    }

    // Every actually-probed URL must be a registry origin.
    expect(probedUrls.length).toBeGreaterThan(0)
    for (const probed of probedUrls) {
      expect(allowlistedOrigins).toContain(probed)
      expect(probed).not.toMatch(/evil/)
    }
  })
})
