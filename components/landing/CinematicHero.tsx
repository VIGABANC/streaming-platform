'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Star, Clock, ChevronRight } from 'lucide-react'
import { backdrop, titleOf, yearOf } from '@/lib/tmdb'
import type { Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface CinematicHeroProps {
  trending: Media[]
}

const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics',
}

export function CinematicHero({ trending }: CinematicHeroProps) {
  const root = useRef<HTMLDivElement>(null)

  // Use first movie with a backdrop
  const heroItem = trending.find(t => t.backdrop_path) || trending[0]
  const genres = (heroItem?.genre_ids ?? []).slice(0, 3).map(id => GENRE_MAP[id]).filter(Boolean)
  const title = heroItem ? titleOf(heroItem) : ''
  const year = heroItem ? yearOf(heroItem) : ''
  const rating = heroItem?.vote_average ? heroItem.vote_average.toFixed(1) : null
  const overview = heroItem?.overview
    ? heroItem.overview.length > 120
      ? heroItem.overview.slice(0, 120).trimEnd() + '…'
      : heroItem.overview
    : null
  const mediaType = heroItem?.media_type === 'tv' ? 'tv' : 'movie'
  const detailHref = heroItem ? `/${mediaType}/${heroItem.id}` : '/browse'

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()

    mm.add({
      reduceMotion: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 1024px)',
    }, (context) => {
      const { reduceMotion, desktop } = context.conditions ?? {}

      if (reduceMotion) {
        gsap.set(root.current, { clearProps: 'all' })
        return
      }

      const tl = gsap.timeline()

      tl.fromTo('.hero-bg',
        { scale: 1.08, filter: 'blur(12px)', opacity: 0 },
        { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power3.out' },
      )
      .fromTo('.hero-eyebrow',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=1',
      )
      .fromTo('.hero-title',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' },
        '-=0.5',
      )
      .fromTo('.hero-meta',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.6',
      )
      .fromTo('.hero-body',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out' },
        '-=0.4',
      )
      .fromTo('.hero-cta',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4',
      )

      if (desktop) {
        gsap.to('.hero-bg', {
          yPercent: 25,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        })
      }
    })

    return () => mm.revert()
  }, [])

  if (!heroItem) return null

  return (
    <section
      ref={root}
      className="relative h-screen w-full flex items-end overflow-hidden"
      aria-label="Featured title"
    >
      {/* Grain overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.035]"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Background image & gradients */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="hero-bg absolute inset-0 transform-gpu">
          {heroItem.backdrop_path ? (
            <Image
              src={backdrop(heroItem.backdrop_path, 'original')}
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="100vw"
              quality={90}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-[#050507]" />
          )}
        </div>
        {/* Left readability gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/75 to-transparent" />
        {/* Bottom fade into next section */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/30 to-transparent" />
        {/* Subtle overall vignette */}
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 lg:px-12 pb-24 md:pb-32">
        {/* Eyebrow */}
        <div className="hero-eyebrow mb-4 flex items-center gap-3">
          <span className="inline-block w-6 h-px bg-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold tracking-[0.25em] text-amber-500 uppercase">
            The Night Signal
          </span>
        </div>

        {/* Title */}
        <h1 className="hero-title text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white mb-4 leading-[1.02] max-w-3xl">
          {title}
        </h1>

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {rating && (
            <div className="hero-meta flex items-center gap-1.5 text-amber-400 text-sm font-semibold">
              <Star className="w-4 h-4 fill-current" aria-hidden="true" />
              <span>{rating}</span>
            </div>
          )}
          {year && (
            <span className="hero-meta text-white/50 text-sm">
              <Clock className="inline w-3.5 h-3.5 mr-1 -mt-0.5" aria-hidden="true" />
              {year}
            </span>
          )}
          {genres.map((g) => (
            <span key={g} className="hero-meta px-2.5 py-0.5 rounded-full border border-white/20 bg-white/5 text-white/70 text-xs font-medium">
              {g}
            </span>
          ))}
        </div>

        {/* Overview */}
        {overview && (
          <p className="hero-body text-base md:text-lg text-white/60 mb-8 max-w-lg font-medium leading-relaxed">
            {overview}
          </p>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <Link
            href="/browse"
            className="hero-cta inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-black font-bold text-sm hover:bg-white/90 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050507] focus:ring-white"
          >
            Start Exploring
          </Link>
          <Link
            href={detailHref}
            className="hero-cta inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white/10 text-white font-bold text-sm backdrop-blur-md hover:bg-white/20 transition-transform active:scale-95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050507] focus:ring-white"
          >
            More Info
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Keyboard hint */}
        <div className="mt-6 flex items-center gap-2 text-white/35 text-xs">
          <kbd className="px-2 py-0.5 rounded border border-white/20 bg-white/5 font-mono text-[10px]">/</kbd>
          <span>Press / to search</span>
        </div>
      </div>
    </section>
  )
}
