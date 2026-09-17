import { createClient } from '@/lib/supabase/client'
import { normalizeLibrarySnapshot, type LibrarySnapshot } from './types'

export async function readCloudLibrary(): Promise<{ userId: string; snapshot: LibrarySnapshot | null; revision: string | null }> {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!authData.user) return { userId: '', snapshot: null, revision: null }

  const { data, error } = await supabase
    .from('user_library_snapshots')
    .select('payload,updated_at')
    .eq('user_id', authData.user.id)
    .maybeSingle()

  if (error) throw error
  return { userId: authData.user.id, snapshot: normalizeLibrarySnapshot(data?.payload), revision: data?.updated_at ?? null }
}

export async function writeCloudLibrary(userId: string, snapshot: LibrarySnapshot, revision: string | null): Promise<boolean> {
  const supabase = createClient()
  const { data: auth, error: authError } = await supabase.auth.getUser()
  if (authError || auth.user?.id !== userId) throw new Error('Library session changed')
  const values = { user_id: userId, version: snapshot.version, payload: snapshot }
  const result = revision === null
    ? await supabase.from('user_library_snapshots').insert(values).select('user_id')
    : await supabase.from('user_library_snapshots').update(values).eq('user_id', userId).eq('updated_at', revision).select('user_id')
  const { data, error } = result
  if (error?.code === '23505') return false
  if (error) throw error
  return Boolean(data?.length)
}
