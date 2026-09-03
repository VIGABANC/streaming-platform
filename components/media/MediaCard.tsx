'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Plus, Check, Play, Star } from 'lucide-react'
import { poster, titleOf, yearOf, type Media, type MediaType } from '@/lib/tmdb'
import { store, mediaToWatchlistItem, showToast } from '@/lib/store'
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
    const nextState = !inWatchlist
    store.toggleWatchlist(mediaToWatchlistItem(item, mediaType))
    setInWatchlist(nextState)
    showToast({
      title: nextState ? 'Added to Watchlist' : 'Removed from Watchlist',
      description: title,
      type: nextState ? 'success' : 'info',
    })
  }

  const imgSrc = landscape
    ? poster(item.backdrop_path, 'w780')
    : poster(item.poster_path, 'w342')

  return (
    <article
      className={`group relative shrink-0 scroll-snap-item ${
        landscape ? 'w-64' : 'w-[145px] sm:w-[170px] lg:w-[190px]'
      }`}
    >
      <Link
        href={href}
        aria-label={`${title} — view details`}
        className="card-hover-glow block overflow-hidden rounded-xl bg-[#0A0D14] shadow-lg outline-none ring-1 ring-white/8 focus-visible:ring-2 focus-visible:ring-primary"
      >
        {/* Poster / Backdrop */}
        <div className={`relative ${landscape ? 'aspect-video' : 'aspect-[2/3]'} overflow-hidden`}>
          <Image
            src={imgSrc}
            alt={`${title} ${landscape ? 'backdrop' : 'poster'}`}
            fill
            sizes={
              landscape
                ? '(max-width: 640px) 256px, 256px'
                : '(max-width: 640px) 145px, (max-width: 1024px) 170px, 190px'
            }
            className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-[1.06]"
            loading={priority ? 'eager' : 'lazy'}
            priority={priority}
          />

          {/* Cinematic vignette on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <div className="grid size-12 place-items-center rounded-full bg-[#E50914] shadow-lg shadow-[#E50914]/40 ring-2 ring-white/20 backdrop-blur-sm transition-transform duration-200 group-hover:scale-100 scale-90">
              <Play size={18} fill="white" className="text-white ml-0.5" />
            </div>
          </div>

          {/* Media type badge — top-left */}
          <div className="absolute left-2 top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              {mediaType === 'tv' ? 'TV' : 'Film'}
            </span>
          </div>
        </div>

        {/* Card footer */}
        <div className="p-2.5 pt-2">
          <p className="truncate text-xs font-semibold leading-snug text-white">{title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            <span>{yearOf(item) || '—'}</span>
            {item.vote_average ? (
              <span className="flex items-center gap-0.5 font-semibold text-amber-400">
                <Star size={10} fill="currentColor" />
                <span>{formatRating(item.vote_average)}</span>
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Watchlist toggle — top-right, visible on hover / focus */}
      <button
        type="button"
        aria-label={`${inWatchlist ? 'Remove' : 'Add'} ${title} ${inWatchlist ? 'from' : 'to'} watchlist`}
        onClick={toggleWatchlist}
        className={`absolute right-2 top-2 grid size-11 touch-target place-items-center rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 hover:scale-110 ${
          inWatchlist
            ? 'bg-[#E50914] text-white shadow-md shadow-[#E50914]/30'
            : 'bg-black/60 text-white/80 hover:bg-[#E50914] hover:text-white'
        }`}
      >
        {inWatchlist ? <Check size={14} /> : <Plus size={14} />}
      </button>
    </article>
  )
}
