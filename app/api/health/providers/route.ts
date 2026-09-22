import { NextResponse } from 'next/server'
import { getAnimeProviderHealthForClient, getConsumetHealthForClient, getProviderHealthForClient } from '@/lib/provider-health'
import { checkRateLimit, requestIdentity } from '@/lib/http/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 60

// Forced refreshes bypass the 60s result cache, so they are rate limited
// per client IP to keep clients from using the endpoint as a probe relay.
const REFRESH_POLICY = { limit: 1, windowMs: 5_000 }

// The only accepted input is the `refresh=1` flag, which bypasses the 60s
// result cache. Probe targets always come from the hardcoded provider
// registry — no request input can influence which origins are probed.
export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get('refresh') === '1'
    if (force) {
      const decision = checkRateLimit(`health-refresh:${requestIdentity(request)}`, REFRESH_POLICY)
      if (!decision.allowed) {
        return NextResponse.json(
          { error: 'Too many forced refreshes. Try again shortly.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(decision.retryAfterSeconds ?? 5),
            },
          },
        )
      }
    }
    const [results, consumet, anime] = await Promise.all([
      getProviderHealthForClient(force),
      getConsumetHealthForClient(force, new URL(request.url).origin),
      getAnimeProviderHealthForClient(force),
    ])
    return NextResponse.json(
      // `consumet` is `{ configured: false }` when CONSUMET_BASE_URL is unset —
      // the self-hosted instance is never probed in that case.
      { providers: results, anime, consumet, cached: true },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    )
  } catch (error) {
    console.error('[health/providers] error:', error)
    return NextResponse.json(
      { error: 'Health check failed', providers: [] },
      { status: 503 },
    )
  }
}
