'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Plus, Check, Heart, Play } from 'lucide-react'
import { poster, titleOf, yearOf, type Media, type MediaType } from '@/lib/tmdb'
import { store, mediaToWatchlistItem } from '@/lib/store'
import { formatRating } from '@/lib/utils'

interface MediaCardProps {
  item: Media & { media_type: MediaType }
  landscape?: boolean
  /** For priority LCP preloading */
  priority?: boolean
}

export function MediaCard({ item, landscape = false, priority = false }: MediaCardProps) {
  const [inWatchlist, setInWatchlist] = useState(false)
  const title = titleOf(item)
  const mediaType = item.media_type
  const href = `/${mediaType}/${item.id}`

  // Hydrate watchlist state
  useEffect(() => {
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }, [item.id, mediaType])

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    store.toggleWatchlist(mediaToWatchlistItem(item, mediaType))
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }

  const imgSrc = landscape
    ? poster(item.backdrop_path, 'w780')
    : poster(item.poster_path, 'w500')

  return (
    <article
      className={`group relative shrink-0 ${
        landscape ? 'w-64' : 'w-[145px] sm:w-[170px] lg:w-[190px]'
      }`}
    >
      <Link
        href={href}
        aria-label={`${title} — view details`}
        className="block overflow-hidden rounded-xl bg-surface shadow-lg outline-none ring-primary focus-visible:ring-2 transition-transform duration-300 group-hover:-translate-y-1"
      >
        <div className={`relative ${landscape ? 'aspect-video' : 'aspect-[2/3]'}`}>
          <Image
            src={imgSrc}
            alt={`${title} ${landscape ? 'backdrop' : 'poster'}`}
            fill
            sizes={
              landscape
                ? '(max-width: 640px) 256px, 256px'
                : '(max-width: 640px) 145px, (max-width: 1024px) 170px, 190px'
            }
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="grid size-12 place-items-center rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
              <Play size={18} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Card footer */}
        <div className="absolute inset-x-0 bottom-0 p-3 pt-8">
          <p className="truncate text-sm font-semibold text-white drop-shadow-md">{title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
            <span>{yearOf(item) || '—'}</span>
            <span className="text-accent">★ {formatRating(item.vote_average)}</span>
            <span className="ml-auto rounded border border-white/20 px-1 py-0.5 text-[10px] uppercase tracking-wide">
              {mediaType === 'tv' ? 'TV' : 'Film'}
            </span>
          </div>
        </div>
      </Link>

      {/* Watchlist button */}
      <button
        type="button"
        aria-label={`${inWatchlist ? 'Remove' : 'Add'} ${title} ${inWatchlist ? 'from' : 'to'} watchlist`}
        onClick={toggleWatchlist}
        className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 focus:opacity-100 hover:scale-110 hover:bg-primary hover:text-primary-foreground focus-visible:opacity-100"
      >
        {inWatchlist ? (
          <Check size={16} className="text-primary group-hover:text-primary-foreground" />
        ) : (
          <Plus size={16} />
        )}
      </button>
    </article>
  )
}
