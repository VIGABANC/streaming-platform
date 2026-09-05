'use client'

import { useEffect } from 'react'
import type { AuthChangeEvent } from '@supabase/supabase-js'
import { isSupabaseConfigError } from '@/lib/config'
import { createClient } from '@/lib/supabase/client'
import { showToast } from '@/lib/store'
import { clearLocalLibrary, LIBRARY_OWNER_KEY, readLocalLibrary, writeLocalLibrary } from '@/lib/library/local-repository'
import { mergeLibrarySnapshots } from '@/lib/library/types'
import { readCloudLibrary, writeCloudLibrary } from '@/lib/library/cloud-repository'

export function LibrarySync() {
  useEffect(() => {
    let cancelled = false
    let syncing = false
    let syncTimer: ReturnType<typeof setTimeout> | undefined

    async function syncLibrary() {
      if (cancelled || syncing) return
      syncing = true
      try {
        const cloud = await readCloudLibrary()
        if (cancelled || !cloud.userId) return

        const previousOwner = window.localStorage.getItem(LIBRARY_OWNER_KEY)
        if (previousOwner && previousOwner !== cloud.userId) clearLocalLibrary()

        const local = readLocalLibrary()
        const merged = cloud.snapshot ? mergeLibrarySnapshots(local, cloud.snapshot) : local
        writeLocalLibrary(merged)
        await writeCloudLibrary(cloud.userId, merged)
        window.localStorage.setItem(LIBRARY_OWNER_KEY, cloud.userId)
      } catch (error) {
        if (!isSupabaseConfigError(error) && !cancelled) {
          showToast({
            title: 'Library sync unavailable',
            description: 'Your local library is safe. We will retry when the connection returns.',
            type: 'warning',
            durationMs: 5000,
          })
        }
      } finally {
        syncing = false
      }
    }

    function scheduleSync() {
      if (syncTimer) clearTimeout(syncTimer)
      syncTimer = setTimeout(() => void syncLibrary(), 600)
    }

    let unsubscribeAuth = () => {}
    try {
      const supabase = createClient()
      const authSubscription = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') scheduleSync()
      })
      unsubscribeAuth = () => authSubscription.data.subscription.unsubscribe()
    } catch (error) {
      if (!isSupabaseConfigError(error)) {
        showToast({ title: 'Library sync unavailable', description: 'Your local library is safe.', type: 'warning' })
      }
    }

    const onStoreChange = () => {
      if (!syncing) scheduleSync()
    }
    window.addEventListener('veyra-store-change', onStoreChange)
    void syncLibrary()

    return () => {
      cancelled = true
      if (syncTimer) clearTimeout(syncTimer)
      unsubscribeAuth()
      window.removeEventListener('veyra-store-change', onStoreChange)
    }
  }, [])

  return null
}
