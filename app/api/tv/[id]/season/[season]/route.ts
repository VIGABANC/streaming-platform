import { NextResponse } from 'next/server'
import { getSeason } from '@/lib/tmdb'

interface RouteParams {
  params: Promise<{ id: string; season: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id, season } = await params
  const seasonNum = parseInt(season, 10)

  if (isNaN(seasonNum)) {
    return NextResponse.json({ error: 'Invalid season number' }, { status: 400 })
  }

  try {
    const data = await getSeason(id, seasonNum)
    return NextResponse.json(data)
  } catch (error) {
    const code = error instanceof Error ? error.message : 'FAILED_TO_LOAD_SEASON'
    return NextResponse.json({ error: code }, { status: 500 })
  }
}
