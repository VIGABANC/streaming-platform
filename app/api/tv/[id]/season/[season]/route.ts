import { NextResponse } from 'next/server'
import { parsePositiveIntSegment } from '@/lib/http/validation'
import { getSeason, TMDBError } from '@/lib/tmdb'

interface RouteParams {
  params: Promise<{ id: string; season: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id, season } = await params
  const tvId = parsePositiveIntSegment(id, { min: 1, max: 2_000_000_000 })
  const seasonNum = parsePositiveIntSegment(season, { min: 0, max: 100 })

  if (tvId === null) {
    return NextResponse.json({ error: 'INVALID_TV_ID' }, { status: 400 })
  }
  if (seasonNum === null) {
    return NextResponse.json({ error: 'INVALID_SEASON_NUMBER' }, { status: 400 })
  }

  try {
    const data = await getSeason(tvId, seasonNum)
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof TMDBError && error.code === 'TMDB_NOT_FOUND') {
      return NextResponse.json({ error: 'SEASON_NOT_FOUND' }, { status: 404 })
    }
    if (error instanceof TMDBError && error.code === 'TMDB_API_KEY_MISSING') {
      return NextResponse.json({ error: 'TMDB_NOT_CONFIGURED' }, { status: 503 })
    }
    if (error instanceof TMDBError && error.code === 'TMDB_RATE_LIMITED') {
      return NextResponse.json({ error: 'SEASON_RATE_LIMITED' }, { status: 503 })
    }
    return NextResponse.json({ error: 'SEASON_LOAD_FAILED' }, { status: 502 })
  }
}
