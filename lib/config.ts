export interface PublicSupabaseConfig {
  url: string
  key: string
}

export const SUPABASE_CONFIG_ERROR = 'SUPABASE_CONFIG_MISSING'

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? ''
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = readEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url || !key) return null

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null
  } catch {
    return null
  }

  return { url, key }
}

export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseConfig() !== null
}

export function getSupabaseConfigError(): Error {
  return new Error(SUPABASE_CONFIG_ERROR)
}

export function isSupabaseConfigError(error: unknown): boolean {
  return error instanceof Error && error.message === SUPABASE_CONFIG_ERROR
}
