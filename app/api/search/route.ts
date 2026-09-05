import { NextResponse } from 'next/server'
import { checkRateLimit, requestIdentity } from '@/lib/http/rate-limit'
import { TMDBError, searchMulti } from '@/lib/tmdb'

const SEARCH_LIMIT = { limit: 30, windowMs: 60_000 }

function requestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `veyra-${Date.now().toString(36)}`
}

function failureCode(error: unknown): { code: string; status: number } {
  if (!(error instanceof TMDBError)) return { code: 'SEARCH_UPSTREAM_FAILED', status: 502 }
  switch (error.code) {
    case 'TMDB_API_KEY_MISSING': return { code: 'TMDB_NOT_CONFIGURED', status: 503 }
    case 'TMDB_AUTH_FAILED': return { code: 'SEARCH_UPSTREAM_AUTH_FAILED', status: 502 }
    case 'TMDB_RATE_LIMITED': return { code: 'SEARCH_UPSTREAM_RATE_LIMITED', status: 503 }
    case 'TMDB_NETWORK_ERROR': return { code: 'SEARCH_NETWORK_FAILED', status: 502 }
    default: return { code: 'SEARCH_UPSTREAM_FAILED', status: 502 }
  }
}

export async function GET(request: Request) {
  const id = requestId()
  const limit = checkRateLimit(requestIdentity(request), SEARCH_LIMIT)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'SEARCH_RATE_LIMITED', requestId: id },
      {
        status: 429,
        headers: {
          'Retry-After': String(limit.retryAfterSeconds ?? 60),
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('query')?.trim() ?? ''

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: 'SEARCH_QUERY_INVALID' }, { status: 400 })
  }

  try {
    const data = await searchMulti(query)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    })
  } catch (error) {
    const failure = failureCode(error)
    console.error('[veyra] TMDB search failed', {
      requestId: id,
      category: failure.code,
      queryLength: query.length,
    })
    return NextResponse.json(
      { error: failure.code, requestId: id },
      { status: failure.status, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
