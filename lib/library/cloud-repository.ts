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
  return { userId: authData.user.id, snapshot: normalizeLibrarySnapshot(data?.payload) }
}

export async function writeCloudLibrary(userId: string, snapshot: LibrarySnapshot): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('user_library_snapshots')
    .upsert(
      { user_id: userId, version: snapshot.version, payload: snapshot, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) throw error
}
