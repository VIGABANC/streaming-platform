'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Play,
  BookmarkPlus,
  BookmarkCheck,
  Heart,
  Star,
  Share2,
  Check,
  X,
} from 'lucide-react'
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
  const [userRating, setUserRating] = useState<number | null>(null)
  const [isRatingOpen, setIsRatingOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
    setIsFavorite(store.isInFavorites(item.id, mediaType))
    setUserRating(store.getRating(item.id, mediaType))
  }, [item.id, mediaType])

  const toggleWatchlist = () => {
    store.toggleWatchlist(mediaToWatchlistItem(item, mediaType))
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }

  const toggleFavorite = () => {
    store.toggleFavorite(mediaToFavoriteItem(item, mediaType))
    setIsFavorite(store.isInFavorites(item.id, mediaType))
  }

  const handleRate = (rating: number) => {
    if (userRating === rating) {
      store.removeRating(item.id, mediaType)
      setUserRating(null)
    } else {
      store.setRating(item.id, mediaType, rating)
      setUserRating(rating)
    }
    setIsRatingOpen(false)
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title || item.name || 'Stream on VEYRA',
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // User cancelled share
    }
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
        className={`inline-flex h-12 items-center gap-2 rounded-full px-5 text-xs font-semibold transition-all hover:scale-[1.02] ${
          inWatchlist
            ? 'bg-primary/20 border border-primary text-primary'
            : 'border border-white/20 bg-white/10 text-white hover:border-primary/50 hover:bg-white/15'
        }`}
      >
        {inWatchlist ? (
          <BookmarkCheck size={16} className="text-primary" />
        ) : (
          <BookmarkPlus size={16} />
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
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* Star Rating Button & Popover */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsRatingOpen((prev) => !prev)}
          className={`inline-flex h-12 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all hover:scale-[1.02] ${
            userRating
              ? 'bg-amber-400/20 border border-amber-400 text-amber-400'
              : 'border border-white/20 bg-white/10 text-white/80 hover:border-amber-400/50 hover:text-amber-300'
          }`}
          title="Rate this title"
        >
          <Star size={16} fill={userRating ? 'currentColor' : 'none'} />
          <span>{userRating ? `${userRating}/10` : 'Rate'}</span>
        </button>

        {isRatingOpen && (
          <div className="absolute bottom-full mb-2 left-0 z-30 flex items-center gap-1 rounded-2xl border border-white/15 bg-[#141526] p-2 shadow-2xl backdrop-blur-xl">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                className={`grid size-7 place-items-center rounded-lg text-xs font-bold transition-all ${
                  userRating && userRating >= star
                    ? 'bg-amber-400 text-black font-black'
                    : 'bg-white/5 text-white/70 hover:bg-amber-400/20 hover:text-amber-300'
                }`}
                title={`Rate ${star} / 10`}
              >
                {star}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsRatingOpen(false)}
              className="ml-1 text-white/40 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Share Button */}
      <button
        type="button"
        onClick={handleShare}
        className="grid size-12 place-items-center rounded-full border border-white/20 bg-white/10 text-white/80 hover:border-white/40 hover:text-white transition-all hover:scale-110"
        title="Share title"
      >
        {copied ? <Check size={18} className="text-primary" /> : <Share2 size={18} />}
      </button>
    </div>
  )
}
