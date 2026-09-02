import { NextResponse } from 'next/server'
import { searchMulti } from '@/lib/tmdb'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('query')?.trim() ?? ''

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  try {
    const data = await searchMulti(query)
    return NextResponse.json(data)
  } catch (error) {
    const code = error instanceof Error ? error.message : 'TMDB_REQUEST_FAILED'
    console.error('[v0] TMDB search failed:', { query, code })
    const status = code === 'TMDB_API_KEY_MISSING' ? 503 : 502
    return NextResponse.json({ error: code }, { status })
  }
}
