'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Plus, Check, Star } from 'lucide-react'
import { useState, useEffect } from 'react'
import { poster, titleOf, yearOf, type Media, type MediaType } from '@/lib/tmdb'
import { store, mediaToWatchlistItem, showToast } from '@/lib/store'
import { formatRating } from '@/lib/utils'

interface RankedCardProps {
  item: Media & { media_type: MediaType }
  rank: number
}

export function RankedCard({ item, rank }: RankedCardProps) {
  const [inWatchlist, setInWatchlist] = useState(false)
  const title = titleOf(item)
  const mediaType = item.media_type
  const href = `/${mediaType}/${item.id}`

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

  const imgSrc = poster(item.poster_path, 'w500')

  return (
    <article className="group relative flex items-end">
      {/* Huge stylized rank number backdrop */}
      <div
        className="font-display select-none font-black text-[96px] sm:text-[120px] lg:text-[140px] leading-none text-transparent stroke-white/20 tracking-tighter shrink-0 w-16 sm:w-20 lg:w-24 -mr-4 sm:-mr-6 z-0"
        style={{
          WebkitTextStroke: '2px rgba(255, 255, 255, 0.3)',
          textShadow: rank <= 3 ? '0 0 25px rgba(229, 9, 20, 0.5)' : 'none',
          color: rank === 1 ? 'rgba(229, 9, 20, 0.25)' : 'transparent',
        }}
      >
        {rank}
      </div>

      {/* Card container */}
      <div className="relative z-10 w-36 sm:w-44 lg:w-52 shrink-0">
        <Link
          href={href}
          aria-label={`#${rank}: ${title}`}
          className="card-hover-glow block overflow-hidden rounded-xl bg-[#0A0D14] shadow-xl outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="relative aspect-[2/3] overflow-hidden">
            <Image
              src={imgSrc}
              alt={`${title} poster`}
              fill
              sizes="(max-width: 640px) 144px, (max-width: 1024px) 176px, 208px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Hover overlay with play button */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="grid size-11 place-items-center rounded-full bg-primary text-white shadow-xl shadow-primary/40 scale-90 group-hover:scale-100 transition-transform">
                <Play size={16} fill="white" className="ml-0.5" />
              </div>
            </div>

            {/* Rank badge top left */}
            <div className="absolute left-2 top-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider backdrop-blur-md ${
                  rank === 1
                    ? 'bg-primary text-white shadow-[0_0_10px_#E50914]'
                    : rank <= 3
                    ? 'bg-amber-400 text-black font-extrabold'
                    : 'bg-black/80 text-white/90 border border-white/10'
                }`}
              >
                #{rank}
              </span>
            </div>
          </div>

          <div className="p-2.5 pt-2">
            <p className="truncate text-xs font-semibold leading-snug text-white">{title}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-white/50">
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

        {/* Watchlist toggle */}
        <button
          type="button"
          aria-label={`${inWatchlist ? 'Remove' : 'Add'} ${title}`}
          onClick={toggleWatchlist}
          className={`absolute right-2 top-2 z-20 grid size-8 place-items-center rounded-full backdrop-blur-md transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 ${
            inWatchlist
              ? 'bg-primary text-white shadow-md shadow-primary/40'
              : 'bg-black/70 text-white/80 hover:bg-primary hover:text-white'
          }`}
        >
          {inWatchlist ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>
    </article>
  )
}
