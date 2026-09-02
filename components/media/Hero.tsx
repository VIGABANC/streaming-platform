'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Play, Info, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { poster, titleOf, yearOf, type Media, type MediaType } from '@/lib/tmdb'
import { store, mediaToWatchlistItem } from '@/lib/store'
import { formatRating } from '@/lib/utils'

interface HeroProps {
  item: Media & { media_type: MediaType }
}

export function Hero({ item }: HeroProps) {
  const [inWatchlist, setInWatchlist] = useState(false)
  const title = titleOf(item)
  const year = yearOf(item)
  const rating = formatRating(item.vote_average)
  const mediaType = item.media_type
  const watchHref =
    mediaType === 'tv'
      ? `/watch/tv/${item.id}/1/1`
      : `/watch/movie/${item.id}`
  const detailHref = `/${mediaType}/${item.id}`

  useEffect(() => {
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }, [item.id, mediaType])

  const toggleWatchlist = () => {
    store.toggleWatchlist(mediaToWatchlistItem(item, mediaType))
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }

  const backdropSrc = poster(item.backdrop_path, 'original')

  return (
    <section
      className="relative min-h-[520px] md:min-h-[600px] overflow-hidden"
      aria-label={`Featured: ${title}`}
    >
      {/* Backdrop image */}
      {item.backdrop_path && (
        <div className="absolute inset-0">
          <Image
            src={backdropSrc}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-55"
            priority
          />
        </div>
      )}

      {/* Gradient overlays */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#0B0C18] via-[#0B0C18]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#0B0C18] via-transparent to-[#0B0C18]/20"
      />

      {/* Content */}
      <div className="relative flex min-h-[520px] md:min-h-[600px] max-w-2xl flex-col justify-end px-5 pb-16 lg:px-12 lg:pb-20">
        {/* Eyebrow */}
        <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[.2em] text-accent" aria-hidden="true">
          <span className="h-px w-6 bg-accent rounded-full" />
          Tonight&apos;s signal
        </p>

        {/* Title */}
        <h1 className="hero-title text-balance">{title}</h1>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
          {year && <span>{year}</span>}
          {item.vote_average ? (
            <span className="flex items-center gap-1 text-accent font-semibold">
              <span aria-hidden="true">★</span>
              <span>{rating}</span>
            </span>
          ) : null}
          <span className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
            {mediaType === 'tv' ? 'Series' : 'Film'}
          </span>
        </div>

        {/* Overview */}
        {item.overview && (
          <p className="mt-4 line-clamp-3 text-pretty text-sm leading-relaxed text-white/65 max-w-lg">
            {item.overview}
          </p>
        )}

        {/* Actions */}
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={watchHref}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-primary"
          >
            <Play size={16} fill="currentColor" aria-hidden="true" />
            Play now
          </Link>

          <Link
            href={detailHref}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white/10 px-6 font-semibold text-white backdrop-blur-sm hover:bg-white/15 transition-colors focus-visible:outline-primary"
          >
            <Info size={16} aria-hidden="true" />
            More info
          </Link>

          <button
            type="button"
            aria-label={`${inWatchlist ? 'Remove from' : 'Add to'} My List: ${title}`}
            aria-pressed={inWatchlist}
            onClick={toggleWatchlist}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-white/20 px-5 font-semibold text-white hover:border-primary hover:text-primary transition-colors focus-visible:outline-primary"
          >
            {inWatchlist ? (
              <BookmarkCheck size={16} className="text-primary" aria-hidden="true" />
            ) : (
              <BookmarkPlus size={16} aria-hidden="true" />
            )}
            {inWatchlist ? 'Saved' : 'My List'}
          </button>
        </div>
      </div>
    </section>
  )
}
