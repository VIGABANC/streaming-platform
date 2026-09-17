import { beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit, requestIdentity, resetRateLimitStore } from '@/lib/http/rate-limit'

describe('request rate limiting', () => {
  beforeEach(() => resetRateLimitStore())

  it('allows the configured number of requests and rejects the next one', () => {
    const policy = { limit: 2, windowMs: 60_000 }
    expect(checkRateLimit('test-client', policy).allowed).toBe(true)
    expect(checkRateLimit('test-client', policy).allowed).toBe(true)
    expect(checkRateLimit('test-client', policy).allowed).toBe(false)
  })

  it('uses only the platform-supplied address header', () => {
    expect(requestIdentity(new Request('https://veyra.test', { headers: { 'x-forwarded-for': 'spoofed' } }))).toBe('anonymous')
    expect(requestIdentity(new Request('https://veyra.test', { headers: { 'x-vercel-forwarded-for': '203.0.113.1', 'x-forwarded-for': 'spoofed' } }))).toBe('203.0.113.1')
  })
})
