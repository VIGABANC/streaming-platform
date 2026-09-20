import { NextResponse } from 'next/server'
import { getProviderHealthForClient } from '@/lib/provider-health'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  try {
    const results = await getProviderHealthForClient()
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
