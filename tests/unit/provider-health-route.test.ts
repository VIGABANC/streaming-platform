import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetRateLimitStore } from '@/lib/http/rate-limit'

vi.mock('node:dns/promises', () => ({
  default: { lookup: vi.fn().mockResolvedValue({ address: '93.184.216.34', family: 4 }) },
}))

import { GET } from '@/app/api/health/providers/route'

afterEach(() => {
  resetRateLimitStore()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('provider health probe redirect boundary', () => {
  it('does not follow provider redirects from the server-side probe', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response('', { status: 302, headers: { location: 'http://127.0.0.1:3000/internal' } }),
    )

    const response = await GET(new Request('https://veyra.test/api/health/providers?refresh=1', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.24', 'x-forwarded-for': '198.51.100.24' },
    }))
    const results = await response.json() as Array<{ status: string }>

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(fetchMock.mock.calls.every(([, init]) => (init as RequestInit).redirect === 'manual')).toBe(true)
    expect(results.filter((result) => result.status === 'embed-unavailable')).toHaveLength(5)
    expect(results.filter((result) => result.status === 'not-configured')).toHaveLength(1)
  })

  it('bounds the provider response body before classifying it', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response('x'.repeat(70 * 1024), { status: 200 }),
    )

    const response = await GET(new Request('https://veyra.test/api/health/providers?refresh=1', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.25', 'x-forwarded-for': '198.51.100.25' },
    }))
    const results = await response.json() as Array<{ status: string }>

    expect(fetchMock).toHaveBeenCalledTimes(5)
    expect(results.filter((result) => result.status === 'embed-unavailable')).toHaveLength(5)
  })

  it('does not let spoofed forwarding headers bypass forced-refresh throttling', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('', { status: 200 }))
    const first = await GET(new Request('https://veyra.test/api/health/providers?refresh=1', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.26', 'x-forwarded-for': '198.51.100.26' },
    }))
    const second = await GET(new Request('https://veyra.test/api/health/providers?refresh=1', {
      headers: { 'x-vercel-forwarded-for': '203.0.113.26', 'x-forwarded-for': '203.0.113.26' },
    }))

    expect(first.status).toBe(200)
    expect(second.status).toBe(429)
  })

  it('allows a refresh identity again after the throttle window expires', async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response('', { status: 200 }))
    const identity = { 'x-vercel-forwarded-for': '203.0.113.27' }
    vi.setSystemTime(1_000_000)
    const first = await GET(new Request('https://veyra.test/api/health/providers?refresh=1', { headers: identity }))
    vi.setSystemTime(1_006_000)
    const second = await GET(new Request('https://veyra.test/api/health/providers?refresh=1', { headers: identity }))

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    vi.useRealTimers()
  })
})
