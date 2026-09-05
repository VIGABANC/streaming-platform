import { afterEach, describe, expect, it, vi } from 'vitest'
import { getPublicSupabaseConfig, isSupabaseConfigured } from '@/lib/config'

describe('public Supabase configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns null when the public URL or key is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')

    expect(getPublicSupabaseConfig()).toBeNull()
    expect(isSupabaseConfigured()).toBe(false)
  })

  it('prefers the publishable key and accepts the legacy anon key', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')

    expect(getPublicSupabaseConfig()).toEqual({
      url: 'https://example.supabase.co',
      key: 'publishable-key',
    })
    expect(isSupabaseConfigured()).toBe(true)
  })
})
