'use client'

import { useEffect, useState } from 'react'
import { Eye, Heart, Star, Bookmark } from 'lucide-react'
import { store, type WatchStats as WatchStatsType } from '@/lib/store'

export function WatchStats() {
  const [stats, setStats] = useState<WatchStatsType | null>(null)

  useEffect(() => {
    setStats(store.getWatchStats())
    
    const unsubscribe = subscribeToStoreChange()
    return unsubscribe
  }, [])

  function subscribeToStoreChange() {
    const handler = () => setStats(store.getWatchStats())
    window.addEventListener('veyra-store-change', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('veyra-store-change', handler)
      window.removeEventListener('storage', handler)
    }
  }

  if (!stats) return null

  const statItems = [
    {
      label: 'Titles Watched',
      value: stats.totalWatchedCount,
      icon: Eye,
      color: 'text-cyan',
      bg: 'bg-cyan/10 border-cyan/20'
    },
    {
      label: 'Favorites',
      value: stats.favoritesCount,
      icon: Heart,
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/20'
    },
    {
      label: 'Watchlist',
      value: stats.watchlistCount,
      icon: Bookmark,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20'
    },
    {
      label: 'Average Rating',
      value: stats.ratingsCount > 0 ? stats.averageGivenRating.toFixed(1) : '-',
      icon: Star,
      color: 'text-green-400',
      bg: 'bg-green-400/10 border-green-400/20'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
      {statItems.map((item) => (
        <div 
          key={item.label}
          className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-4 text-center transition-transform hover:scale-105 sm:p-6"
        >
          <div className={`mb-3 flex size-10 items-center justify-center rounded-full border ${item.bg}`}>
            <item.icon size={18} className={item.color} />
          </div>
          <p className="font-display text-2xl font-bold text-white sm:text-3xl">
            {item.value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}
