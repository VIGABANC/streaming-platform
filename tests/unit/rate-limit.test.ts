import { beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit, resetRateLimitStore } from '@/lib/http/rate-limit'

describe('request rate limiting', () => {
  beforeEach(() => resetRateLimitStore())

  it('allows the configured number of requests and rejects the next one', () => {
    const policy = { limit: 2, windowMs: 60_000 }
    expect(checkRateLimit('test-client', policy).allowed).toBe(true)
    expect(checkRateLimit('test-client', policy).allowed).toBe(true)
    expect(checkRateLimit('test-client', policy).allowed).toBe(false)
  })
})
