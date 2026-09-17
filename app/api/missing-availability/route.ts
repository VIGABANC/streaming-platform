import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseMissingAvailabilityReport } from '@/lib/missing-availability'
import { checkRateLimit, requestIdentity } from '@/lib/http/rate-limit'

const REPORT_LIMIT = { limit: 5, windowMs: 60_000 }

export async function POST(request: Request) {
  const limit = checkRateLimit(requestIdentity(request), REPORT_LIMIT)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'REPORT_RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60), 'Cache-Control': 'no-store' } },
    )
  }
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 })
    }

    const report = parseMissingAvailabilityReport(await request.json())
    const { error } = await supabase.from('missing_availability_reports').insert({
      user_id: authData.user.id,
      source_id: report.sourceId,
      source: report.source,
      region: report.region,
      media_type: report.mediaType,
      provider_id: report.providerId,
      description: report.description,
    })
    if (error) return NextResponse.json({ error: 'REPORT_STORAGE_FAILED' }, { status: 502 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'REPORT_INVALID' }, { status: 400 })
  }
}
