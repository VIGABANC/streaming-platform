import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) return NextResponse.redirect(new URL('/auth/login?auth=error', url.origin))
    } catch {
      return NextResponse.redirect(new URL('/auth/login?auth=unavailable', url.origin))
    }
  }
  return NextResponse.redirect(new URL('/profile', url.origin))
}
