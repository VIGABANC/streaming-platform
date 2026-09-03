'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Play, Info, BookmarkPlus, BookmarkCheck, Star } from 'lucide-react'
import { backdrop, genres as tmdbGenres, titleOf, yearOf, type Media, type MediaType } from '@/lib/tmdb'
import { store, mediaToWatchlistItem } from '@/lib/store'
import { formatRating, formatRuntime } from '@/lib/utils'

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

  const allGenres = mediaType === 'tv' ? tmdbGenres.tv : tmdbGenres.movie
  const genreNames = (item.genre_ids ?? []).slice(0, 3).map(
    (id: number) => allGenres.find((g) => g.id === id)?.name
  ).filter(Boolean) as string[]

  useEffect(() => {
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }, [item.id, mediaType])

  const toggleWatchlist = () => {
    store.toggleWatchlist(mediaToWatchlistItem(item, mediaType))
    setInWatchlist(store.isInWatchlist(item.id, mediaType))
  }

  const backdropSrc = backdrop(item.backdrop_path, 'w1280')

  return (
    <section
      className="relative min-h-[540px] md:min-h-[640px] w-full overflow-hidden bg-[#050507]"
      aria-label={`Featured: ${title}`}
    >
      {/* Backdrop image with LCP priority */}
      {item.backdrop_path && (
        <div className="absolute inset-0">
          <Image
            src={backdropSrc}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center opacity-60 transition-scale duration-700 hover:scale-105"
            priority
          />
        </div>
      )}

      {/* High-contrast gradient vignette fading into pitch black #050507 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-radial from-transparent via-[#050507]/20 to-[#050507]"
      />

      {/* Content Container */}
      <div className="relative flex min-h-[540px] md:min-h-[640px] max-w-3xl flex-col justify-end px-5 pb-16 lg:px-12 lg:pb-24 z-10">
        {/* Eyebrow Signal */}
        <div className="mb-3 flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[.25em] text-accent">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#E50914]" />
          <span>The Night Signal</span>
        </div>

        {/* Title display */}
        <h1 className="hero-title text-balance drop-shadow-lg">{title}</h1>

        {/* Meta Bar: Year, Rating Star, Media Tag, Genre Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-white/80 font-medium">
          {year && <span className="font-bold">{year}</span>}
          {item.vote_average ? (
            <span className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-400 font-bold">
              <Star size={12} fill="currentColor" />
              <span>{rating}</span>
            </span>
          ) : null}
          <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {mediaType === 'tv' ? 'Series' : 'Film'}
          </span>
          {item.runtime ? (
            <span className="text-white/60">{formatRuntime(item.runtime)}</span>
          ) : null}

          {/* Genre Pills */}
          {genreNames.map((g) => (
            <span
              key={g}
              className="rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-[11px] text-white/70"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Overview */}
        {item.overview && (
          <p className="mt-4 line-clamp-3 text-pretty text-sm leading-relaxed text-white/70 max-w-xl">
            {item.overview}
          </p>
        )}

        {/* Dual Primary CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={watchHref}
            className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-primary touch-target"
          >
            <Play size={18} fill="currentColor" aria-hidden="true" />
            <span>Watch Now</span>
          </Link>

          <button
            type="button"
            aria-label={`${inWatchlist ? 'Remove from' : 'Add to'} Watchlist: ${title}`}
            aria-pressed={inWatchlist}
            onClick={toggleWatchlist}
            className={`inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold text-xs transition-all hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-primary touch-target ${
              inWatchlist
                ? 'bg-primary/20 border border-primary text-primary'
                : 'glass-panel text-white hover:bg-white/15'
            }`}
          >
            {inWatchlist ? (
              <BookmarkCheck size={17} className="text-primary" aria-hidden="true" />
            ) : (
              <BookmarkPlus size={17} aria-hidden="true" />
            )}
            <span>{inWatchlist ? 'In Watchlist' : '+ Watchlist'}</span>
          </button>

          <Link
            href={detailHref}
            className="inline-flex h-12 items-center gap-2 rounded-full glass-panel px-5 font-semibold text-xs text-white/90 hover:text-white hover:bg-white/15 transition-all hover:scale-[1.03] focus-visible:outline-primary touch-target"
          >
            <Info size={16} aria-hidden="true" />
            <span>Details</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

