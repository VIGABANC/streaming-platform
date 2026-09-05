export interface RateLimitPolicy {
  limit: number
  windowMs: number
}

export interface RateLimitDecision {
  allowed: boolean
  remaining: number
  retryAfterSeconds?: number
}

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function checkRateLimit(identity: string, policy: RateLimitPolicy, now = Date.now()): RateLimitDecision {
  const current = buckets.get(identity)
  if (!current || current.resetAt <= now) {
    buckets.set(identity, { count: 1, resetAt: now + policy.windowMs })
    return { allowed: true, remaining: Math.max(policy.limit - 1, 0) }
  }

  if (current.count >= policy.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  return { allowed: true, remaining: Math.max(policy.limit - current.count, 0) }
}

export function resetRateLimitStore(): void {
  buckets.clear()
}

export function requestIdentity(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || request.headers.get('x-real-ip') || 'anonymous'
}
