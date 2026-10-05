import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { PROVIDERS } from '@/lib/player'
import { checkRateLimit, requestIdentity } from '@/lib/http/rate-limit'
const COOKIE = 'veyra_preferred_provider'; const valid = (id: unknown): id is string => typeof id === 'string' && PROVIDERS.some((provider) => provider.id === id)
export async function GET() { const id = (await cookies()).get(COOKIE)?.value; return NextResponse.json({ providerId: valid(id) ? id : null }) }
export async function POST(request: Request) { const limit = checkRateLimit(requestIdentity(request), { limit: 10, windowMs: 60_000 }); if (!limit.allowed) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds ?? 60) } }); try { const body = await request.json(); if (!valid(body?.providerId)) return NextResponse.json({ error: 'INVALID_PROVIDER' }, { status: 400 }); const response = NextResponse.json({ ok: true }); response.cookies.set(COOKIE, body.providerId, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60, path: '/' }); return response } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }) } }
