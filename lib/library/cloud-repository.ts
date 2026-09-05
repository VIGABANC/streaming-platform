import { createClient } from '@/lib/supabase/client'
import { normalizeLibrarySnapshot, type LibrarySnapshot } from './types'

export async function readCloudLibrary(): Promise<{ userId: string; snapshot: LibrarySnapshot | null }> {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user) return { userId: '', snapshot: null }

  const { data, error } = await supabase
    .from('user_library_snapshots')
    .select('payload')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (error) throw error
  if (data?.payload === null || data?.payload === undefined) return { userId: authData.user.id, snapshot: null }
  const snapshot = normalizeLibrarySnapshot(data.payload)
  if (!snapshot) throw new Error('INVALID_CLOUD_LIBRARY')
  return { userId: authData.user.id, snapshot }
}

export async function writeCloudLibrary(snapshot: LibrarySnapshot): Promise<void> {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user) throw new Error('AUTH_REQUIRED')
  const normalized = normalizeLibrarySnapshot({ ...snapshot, version: 1 })
  if (!normalized) throw new Error('INVALID_LIBRARY_SNAPSHOT')
  const { error } = await supabase
    .from('user_library_snapshots')
    .upsert(
      { user_id: authData.user.id, version: normalized.version, payload: normalized, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) throw error
}
