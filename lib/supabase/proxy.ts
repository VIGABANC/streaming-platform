import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getPublicSupabaseConfig } from '@/lib/config'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const config = getPublicSupabaseConfig()
  if (!config) return response

  try {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })
    await supabase.auth.getUser()
  } catch {
    // Browsing is intentionally available when auth configuration or the auth service is unavailable.
  }

  return response
}
