import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseConfig, getSupabaseConfigError } from '@/lib/config'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!browserClient) {
    const config = getPublicSupabaseConfig()
    if (!config) throw getSupabaseConfigError()

    browserClient = createBrowserClient(
      config.url,
      config.key,
    )
  }
  return browserClient
}
