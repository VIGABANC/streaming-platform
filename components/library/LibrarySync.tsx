'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigError } from '@/lib/config'
import { showToast } from '@/lib/store'
import { readLocalLibrary, writeLocalLibrary } from '@/lib/library/local-repository'
import { baselineKey, LIBRARY_OWNER_KEY, storedSnapshot, switchLibraryOwner } from '@/lib/library/session'
import { readCloudLibrary, writeCloudLibrary } from '@/lib/library/cloud-repository'
import { syncLibraryOnce } from '@/lib/library/sync'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export function LibrarySync() {
  useEffect(() => {
    let disposed = false
    let generation = 0
    let userId: string | null = null
    let applying = false
    let syncing = false
    let pending = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      pending = true
      clearTimeout(timer)
      timer = setTimeout(() => void sync(), 600)
    }
    async function sync() {
      if (disposed || !userId || syncing) return
      const owner = userId
      const epoch = generation
      const isCurrent = () => !disposed && generation === epoch && userId === owner && localStorage.getItem(LIBRARY_OWNER_KEY) === owner
      syncing = true
      pending = false
      try {
        const result = await syncLibraryOnce({
          isCurrent, readLocal: readLocalLibrary,
          baseline: storedSnapshot(localStorage, baselineKey(owner)) ?? undefined,
          readRemote: async () => {
            const cloud = await readCloudLibrary()
            if (cloud.userId !== owner) throw new Error('Library session changed')
            return cloud
          },
          writeRemote: (snapshot, revision) => isCurrent() ? writeCloudLibrary(owner, snapshot, revision) : Promise.resolve(false),
          apply: (snapshot, baseline) => {
            applying = true
            try {
              localStorage.setItem(baselineKey(owner), JSON.stringify(baseline))
              const local = readLocalLibrary()
              if (JSON.stringify({ ...local, exportedAt: '' }) !== JSON.stringify({ ...snapshot, exportedAt: '' })) writeLocalLibrary(snapshot)
            } finally { applying = false }
          },
        })
        if (result === 'changed') pending = true
        if (result === 'conflict') throw new Error('Concurrent library changes')
      } catch {
        if (isCurrent()) showToast({ title: 'Library sync unavailable', description: 'Your changes are saved on this device. Retry by reconnecting or returning to this tab.', type: 'warning' })
      } finally {
        syncing = false
        if (pending && !disposed) schedule()
      }
    }
    let unsubscribe = () => {}
    try {
      const subscription = createClient().auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
        if (disposed) return
        const next = session?.user.id ?? null
        if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION' || next !== userId) {
          generation++
          userId = next
          applying = true
          try { writeLocalLibrary(switchLibraryOwner(localStorage, next, readLocalLibrary())) }
          catch { showToast({ title: 'Library storage unavailable', description: 'Export your library before switching accounts.', type: 'error' }); userId = null }
          finally { applying = false }
        }
        if (userId) schedule()
      })
      unsubscribe = () => subscription.data.subscription.unsubscribe()
    } catch (error) {
      if (!isSupabaseConfigError(error)) showToast({ title: 'Library sync unavailable', type: 'warning' })
    }
    const changed = () => { if (!applying) schedule() }
    window.addEventListener('veyra-store-change', changed)
    window.addEventListener('online', schedule)
    window.addEventListener('focus', schedule)
    window.addEventListener('storage', changed)
    return () => {
      disposed = true
      generation++
      clearTimeout(timer)
      unsubscribe()
      window.removeEventListener('veyra-store-change', changed)
      window.removeEventListener('online', schedule)
      window.removeEventListener('focus', schedule)
      window.removeEventListener('storage', changed)
    }
  }, [])
  return null
}
