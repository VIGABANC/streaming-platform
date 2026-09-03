'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Info, BookmarkPlus, BookmarkCheck, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { backdrop, genres as tmdbGenres, titleOf, yearOf, type Media, type MediaType } from '@/lib/tmdb'
import { store, mediaToWatchlistItem, showToast } from '@/lib/store'
import { formatRating } from '@/lib/utils'

interface HeroCarouselProps {
  items: (Media & { media_type: MediaType })[]
  autoSlideIntervalMs?: number
}

export function HeroCarousel({ items, autoSlideIntervalMs = 7000 }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const slides = items.slice(0, 5)
  const currentItem = slides[currentIndex] || slides[0]

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  // Timer loop with pause on hover
  useEffect(() => {
    if (isPaused || slides.length <= 1) return
    timerRef.current = setInterval(nextSlide, autoSlideIntervalMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPaused, nextSlide, autoSlideIntervalMs, slides.length])

  // Hydrate watchlist status
  useEffect(() => {
    if (currentItem) {
      setInWatchlist(store.isInWatchlist(currentItem.id, currentItem.media_type))
    }
  }, [currentItem])

  if (!currentItem) return null

  const title = titleOf(currentItem)
  const year = yearOf(currentItem)
  const rating = formatRating(currentItem.vote_average)
  const mediaType = currentItem.media_type
  const watchHref =
    mediaType === 'tv'
      ? `/watch/tv/${currentItem.id}/1/1`
      : `/watch/movie/${currentItem.id}`
  const detailHref = `/${mediaType}/${currentItem.id}`

  const allGenres = mediaType === 'tv' ? tmdbGenres.tv : tmdbGenres.movie
  const genreNames = (currentItem.genre_ids ?? [])
    .slice(0, 3)
    .map((id: number) => allGenres.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[]

  const toggleWatchlist = () => {
    const nextState = !inWatchlist
    store.toggleWatchlist(mediaToWatchlistItem(currentItem, mediaType))
    setInWatchlist(nextState)
    showToast({
      title: nextState ? 'Added to Watchlist' : 'Removed from Watchlist',
      description: title,
      type: nextState ? 'success' : 'info',
    })
  }

  return (
    <section
      className="relative min-h-[540px] md:min-h-[660px] w-full overflow-hidden bg-[#050507]"
      aria-label="Featured Spotlight Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Slides with Cross-Fade */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex
        const src = backdrop(slide.backdrop_path, 'original')
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-60 z-0 scale-100' : 'opacity-0 -z-10 scale-105 pointer-events-none'
            }`}
          >
            {slide.backdrop_path && (
              <Image
                src={src}
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-center"
                priority={index === 0}
              />
            )}
          </div>
        )
      })}

      {/* High-contrast gradient vignette fading into pitch black #050507 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent z-[1]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/40 to-transparent z-[1]"
      />

      {/* Content Container */}
      <div className="relative flex min-h-[540px] md:min-h-[660px] max-w-3xl flex-col justify-end px-5 pb-20 lg:px-12 lg:pb-24 z-10">
        {/* Eyebrow Signal */}
        <div className="mb-3 flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[.25em] text-accent">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#E50914]" />
          <span>Spotlight • #{currentIndex + 1} Featured</span>
        </div>

        {/* Title display with key transition */}
        <h1
          key={currentItem.id}
          className="hero-title text-balance drop-shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          {title}
        </h1>

        {/* Meta Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-white/80 font-medium">
          {year && <span className="font-bold">{year}</span>}
          {currentItem.vote_average ? (
            <span className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-amber-400 font-bold">
              <Star size={12} fill="currentColor" />
              <span>{rating}</span>
            </span>
          ) : null}
          <span className="rounded border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {mediaType === 'tv' ? 'Series' : 'Film'}
          </span>

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
        {currentItem.overview && (
          <p className="mt-4 line-clamp-3 text-pretty text-sm leading-relaxed text-white/70 max-w-xl">
            {currentItem.overview}
          </p>
        )}

        {/* Dual Primary CTA */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={watchHref}
            className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-7 font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.03] active:scale-[0.98] touch-target"
          >
            <Play size={18} fill="currentColor" aria-hidden="true" />
            <span>Watch Now</span>
          </Link>

          <button
            type="button"
            aria-label={`${inWatchlist ? 'Remove from' : 'Add to'} Watchlist: ${title}`}
            aria-pressed={inWatchlist}
            onClick={toggleWatchlist}
            className={`inline-flex h-12 items-center gap-2 rounded-full px-6 font-semibold text-xs transition-all hover:scale-[1.03] active:scale-[0.98] touch-target ${
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
            className="inline-flex h-12 items-center gap-2 rounded-full glass-panel px-5 font-semibold text-xs text-white/90 hover:text-white hover:bg-white/15 transition-all hover:scale-[1.03] touch-target"
          >
            <Info size={16} aria-hidden="true" />
            <span>Details</span>
          </Link>
        </div>
      </div>

      {/* Progress Bars & Slide Selector Dots */}
      <div className="absolute bottom-6 left-5 lg:left-12 z-20 flex items-center gap-2">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex
          return (
            <button
              key={slide.id}
              type="button"
              aria-label={`Go to slide ${index + 1}: ${titleOf(slide)}`}
              onClick={() => setCurrentIndex(index)}
              className="group py-2 focus:outline-none"
            >
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'w-10 bg-primary shadow-[0_0_8px_#E50914]'
                    : 'w-4 bg-white/20 group-hover:bg-white/40'
                }`}
              />
            </button>
          )
        })}
      </div>

      {/* Chevron Nav Controls */}
      <div className="absolute bottom-6 right-5 lg:right-12 z-20 hidden sm:flex items-center gap-2">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={prevSlide}
          className="grid size-10 place-items-center rounded-full border border-white/10 bg-black/40 text-white/70 hover:border-white/30 hover:bg-black/80 hover:text-white backdrop-blur-md transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={nextSlide}
          className="grid size-10 place-items-center rounded-full border border-white/10 bg-black/40 text-white/70 hover:border-white/30 hover:bg-black/80 hover:text-white backdrop-blur-md transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
