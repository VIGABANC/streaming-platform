'use client'

import { useEffect } from 'react'
import { showToast } from '@/lib/store'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

    let disposed = false
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
        if (disposed) return
        await registration.update()

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state !== 'installed' || !navigator.serviceWorker.controller) return
            showToast({
              title: 'A new VEYRA version is ready',
              description: 'Reload to receive the latest experience.',
              type: 'info',
              durationMs: 0,
              action: {
                label: 'Reload',
                onClick: () => {
                  worker.postMessage({ type: 'SKIP_WAITING' })
                  window.location.reload()
                },
              },
            })
          })
        })
      } catch {
        // Offline browsing remains available; registration is an enhancement.
      }
    }

    void register()
    return () => {
      disposed = true
    }
  }, [])

  return null
}
