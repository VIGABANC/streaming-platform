'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Star, Heart, Bookmark } from 'lucide-react'
import { store } from '@/lib/store'
import { poster } from '@/lib/tmdb'

function getRelativeTime(timestamp: number) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const daysDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60 * 24))
  
  if (Math.abs(daysDifference) < 1) {
    const hoursDifference = Math.round((timestamp - Date.now()) / (1000 * 60 * 60))
    if (Math.abs(hoursDifference) < 1) {
      const minutesDifference = Math.round((timestamp - Date.now()) / (1000 * 60))
      return rtf.format(minutesDifference, 'minute')
    }
    return rtf.format(hoursDifference, 'hour')
  }
  return rtf.format(daysDifference, 'day')
}

type ActivityType = 'watched' | 'rated' | 'favorited' | 'watchlist'

interface Activity {
  id: string
  type: ActivityType
  mediaId: number
  mediaType: 'movie' | 'tv'
  title: string
  posterPath?: string | null
  timestamp: number
  meta?: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    loadActivities()
    
    const unsubscribe = subscribeToStoreChange()
    return unsubscribe
  }, [])

  function loadActivities() {
    const history = store.getHistory().slice(0, 10).map(item => ({
      id: `watched-${item.id}-${item.watchedAt}`,
      type: 'watched' as ActivityType,
      mediaId: item.id,
      mediaType: item.media_type,
      title: item.title,
      posterPath: item.poster_path,
      timestamp: item.watchedAt,
      meta: item.episodeTitle ? `S${item.season} E${item.episode} - ${item.episodeTitle}` : undefined
    }))

    const ratings = store.getRatings().slice(0, 10).map(item => ({
      id: `rated-${item.id}-${item.ratedAt}`,
      type: 'rated' as ActivityType,
      mediaId: item.id,
      mediaType: item.media_type,
      title: item.title || 'Unknown Title',
      posterPath: item.poster_path,
      timestamp: item.ratedAt,
      meta: `Rated ${item.rating}/10`
    }))

    const favorites = store.getFavorites().slice(0, 10).map(item => ({
      id: `fav-${item.id}-${item.favoritedAt}`,
      type: 'favorited' as ActivityType,
      mediaId: item.id,
      mediaType: item.media_type,
      title: item.title || item.name || 'Unknown Title',
      posterPath: item.poster_path,
      timestamp: item.favoritedAt
    }))

    const all = [...history, ...ratings, ...favorites]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20)
      
    setActivities(all)
  }

  function subscribeToStoreChange() {
    const handler = () => loadActivities()
    window.addEventListener('veyra-store-change', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('veyra-store-change', handler)
      window.removeEventListener('storage', handler)
    }
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-8 text-center sm:p-12">
        <div className="mb-4 rounded-full bg-white/10 p-4">
          <Play size={24} className="text-white/50" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Recent Activity</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start watching, rating, or favoriting titles to see your activity here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div 
          key={activity.id}
          className="group relative flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05] sm:gap-6 sm:p-4"
        >
          {/* Action Icon */}
          <div className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0A0D14] ring-1 ring-white/10 group-hover:ring-white/30">
            {activity.type === 'watched' && <Play size={16} className="text-cyan ml-0.5" />}
            {activity.type === 'rated' && <Star size={16} className="text-green-400" />}
            {activity.type === 'favorited' && <Heart size={16} className="text-primary" />}
            {activity.type === 'watchlist' && <Bookmark size={16} className="text-amber-400" />}
          </div>

          {/* Poster */}
          <Link 
            href={`/${activity.mediaType === 'tv' ? 'tv' : 'movie'}/${activity.mediaId}`}
            className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-[#0A0D14] sm:w-16"
          >
            <Image
              src={poster(activity.posterPath, 'w154')}
              alt={activity.title}
              fill
              sizes="(max-width: 640px) 48px, 64px"
              className="object-cover transition-transform group-hover:scale-110"
            />
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-xs text-muted-foreground sm:hidden">
                {activity.type === 'watched' && 'Watched'}
                {activity.type === 'rated' && 'Rated'}
                {activity.type === 'favorited' && 'Favorited'}
              </span>
              
              <Link
                href={`/${activity.mediaType === 'tv' ? 'tv' : 'movie'}/${activity.mediaId}`}
                className="font-medium text-white truncate hover:text-primary transition-colors text-sm sm:text-base"
              >
                {activity.title}
              </Link>
            </div>
            
            {activity.meta && (
              <p className="mt-1 text-xs font-medium text-white/70">
                {activity.meta}
              </p>
            )}
            
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
              {getRelativeTime(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
