import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { PROVIDERS } from '@/lib/player'

const COOKIE_NAME = 'veyra_preferred_provider'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { providerId?: unknown }
    const providerId = typeof body.providerId === 'string' ? body.providerId : ''
    if (!PROVIDERS.some((provider) => provider.id === providerId)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.set(COOKIE_NAME, providerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET() {
  const preferredProviderId = (await cookies()).get(COOKIE_NAME)?.value ?? null
  return NextResponse.json({ preferredProviderId }, { headers: { 'cache-control': 'no-store' } })
}
