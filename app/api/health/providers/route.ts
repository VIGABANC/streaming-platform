import { NextResponse } from 'next/server'
import { getProviderHealthForClient } from '@/lib/provider-health'

export const dynamic = 'force-dynamic'
export const revalidate = 60

// The only accepted input is the `refresh=1` flag, which bypasses the 60s
// result cache. Probe targets always come from the hardcoded provider
// registry — no request input can influence which origins are probed.
export async function GET(request: Request) {
  try {
    const force = new URL(request.url).searchParams.get('refresh') === '1'
    const results = await getProviderHealthForClient(force)
    return NextResponse.json(
      { providers: results, cached: true },
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
