'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Play, BookmarkPlus, BookmarkCheck, Heart } from 'lucide-react'
import { store, mediaToWatchlistItem, mediaToFavoriteItem } from '@/lib/store'
import type { Media, MediaType } from '@/lib/tmdb'

interface MediaDetailActionsProps {
  item: Media
  mediaType: MediaType
  watchHref: string
}

export function MediaDetailActions({ item, mediaType, watchHref }: MediaDetailActionsProps) {
  const [inWatchlist, setInWatchlist] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
    setIsFavorite(store.isInFavorites(item.id, mediaType))
  }, [item.id, mediaType])

  const toggleWatchlist = () => {
    store.toggleWatchlist(mediaToWatchlistItem(item, mediaType))
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }

  const toggleFavorite = () => {
    store.toggleFavorite(mediaToFavoriteItem(item, mediaType))
    setIsFavorite(store.isInFavorites(item.id, mediaType))
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {/* Play Button */}
      <Link
        href={watchHref}
        className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-[1.02] focus-visible:outline-primary"
      >
        <Play size={18} fill="currentColor" aria-hidden="true" />
        <span>Play {mediaType === 'movie' ? 'Movie' : 'Series'}</span>
      </Link>

      {/* Watchlist Button */}
      <button
        type="button"
        onClick={toggleWatchlist}
        aria-pressed={inWatchlist}
        aria-label={`${inWatchlist ? 'Remove from' : 'Add to'} Watchlist`}
        className={`inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold transition-all hover:scale-[1.02] ${
          inWatchlist
            ? 'bg-primary/20 border border-primary text-primary'
            : 'border border-white/20 bg-white/10 text-white hover:border-primary/50 hover:bg-white/15'
        }`}
      >
        {inWatchlist ? (
          <BookmarkCheck size={18} className="text-primary" />
        ) : (
          <BookmarkPlus size={18} />
        )}
        <span>{inWatchlist ? 'In Watchlist' : 'Add to List'}</span>
      </button>

      {/* Favorite Button */}
      <button
        type="button"
        onClick={toggleFavorite}
        aria-pressed={isFavorite}
        aria-label={`${isFavorite ? 'Remove from' : 'Add to'} Favorites`}
        className={`grid size-12 place-items-center rounded-full transition-all hover:scale-110 ${
          isFavorite
            ? 'bg-rose-500/20 border border-rose-500 text-rose-500'
            : 'border border-white/20 bg-white/10 text-white/80 hover:border-rose-500/50 hover:text-rose-400'
        }`}
      >
        <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
