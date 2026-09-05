import { NextResponse } from 'next/server'
import { checkRateLimit, requestIdentity } from '@/lib/http/rate-limit'
import { TMDBError, searchMulti } from '@/lib/tmdb'
import { AniListError, searchAnime } from '@/lib/anilist'
import { normalizeAnimeSearchResult, normalizeTmdbSearchResult } from '@/lib/search/normalize'

const SEARCH_LIMIT = { limit: 30, windowMs: 60_000 }

function requestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `veyra-${Date.now().toString(36)}`
}

function failureCode(error: unknown): string {
  if (error instanceof TMDBError && error.code === 'TMDB_API_KEY_MISSING') return 'TMDB_NOT_CONFIGURED'
  if (error instanceof AniListError && error.code === 'RATE_LIMITED') return 'ANIME_UPSTREAM_RATE_LIMITED'
  if (error instanceof TMDBError && error.code === 'TMDB_RATE_LIMITED') return 'TMDB_UPSTREAM_RATE_LIMITED'
  return 'SEARCH_UPSTREAM_UNAVAILABLE'
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
  const scope = url.searchParams.get('scope') ?? 'all'

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  if (query.length < 2 || query.length > 100) {
    return NextResponse.json({ error: 'SEARCH_QUERY_INVALID' }, { status: 400 })
  }
  if (scope !== 'all' && scope !== 'movie' && scope !== 'tv' && scope !== 'anime') {
    return NextResponse.json({ error: 'SEARCH_SCOPE_INVALID' }, { status: 400 })
  }

  const tmdbRequested = scope === 'all' || scope === 'movie' || scope === 'tv'
  const animeRequested = scope === 'all' || scope === 'anime'
  const [tmdbResult, animeResult] = await Promise.all([
    tmdbRequested ? searchMulti(query).then((data) => ({ results: (data.results ?? []).map(normalizeTmdbSearchResult).filter((item): item is NonNullable<typeof item> => item !== null).filter((item) => scope === 'all' || item.ref.kind === scope), failure: null })).catch((error) => ({ results: [], failure: failureCode(error) })) : Promise.resolve({ results: [], failure: null }),
    animeRequested ? searchAnime(query).then((items) => ({ results: items.map(normalizeAnimeSearchResult), failure: null })).catch((error) => ({ results: [], failure: failureCode(error) })) : Promise.resolve({ results: [], failure: null }),
  ])
  const results = [...tmdbResult.results, ...animeResult.results]
  const failures = [tmdbResult.failure, animeResult.failure].filter((failure): failure is string => Boolean(failure))
  if (!results.length && failures.length === (Number(tmdbRequested) + Number(animeRequested))) {
    console.error('[veyra] search upstream unavailable', { requestId: id, scope, queryLength: query.length, sources: failures.length })
    return NextResponse.json({ error: 'SEARCH_UPSTREAM_UNAVAILABLE', requestId: id }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json({ results, failures }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    })
}
