'use client'

import { useEffect } from 'react'
import { store, type ContinueWatchingItem } from '@/lib/store'

interface ContinueWatchingTrackerProps {
  item: ContinueWatchingItem
}

export function ContinueWatchingTracker({ item }: ContinueWatchingTrackerProps) {
  useEffect(() => {
    store.updateContinueWatching({
      ...item,
      lastOpenedAt: Date.now(),
    })
  }, [item])

  return null
}
