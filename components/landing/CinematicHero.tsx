'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { heroGenreNames } from '@/components/landing/landing-types'
import { backdrop, titleOf, yearOf, type Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface CinematicHeroProps { item?: Media }

export function CinematicHero({ item }: CinematicHeroProps) {
  const root = useRef<HTMLElement>(null)
  const hasArtwork = Boolean(item?.backdrop_path)
  const title = item ? titleOf(item) : 'Find the story worth staying up for.'
  const mediaType = item?.media_type === 'tv' ? 'TV series' : item ? 'Film' : undefined
  const genres = item ? heroGenreNames(item) : []
  const overview = item?.overview || 'Discover cinematic moments. VEYRA brings movies and television discovery into one elegant experience.'

  useLayoutEffect(() => {
    if (!root.current) return
    let context: gsap.Context | undefined
    try {
      context = gsap.context(() => {
        const media = gsap.matchMedia()
        media.add({ reduceMotion: '(prefers-reduced-motion: reduce)', desktop: '(min-width: 1024px)' }, (match) => {
          if (match.conditions?.reduceMotion) return
          gsap.timeline()
            .fromTo('[data-hero-backdrop]', { scale: 1.04, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' })
            .fromTo('[data-hero-atmosphere]', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' }, '<0.1')
            .fromTo('[data-hero-content]', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }, '<0.15')
          if (match.conditions?.desktop) {
            gsap.to('[data-hero-backdrop]', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
          }
        })
        return () => media.revert()
      }, root)
    } catch {
      // Base styles keep the title and calls to action visible if motion cannot initialize.
    }
    return () => context?.revert()
  }, [])

  return <section ref={root} className="relative flex min-h-[42rem] items-end overflow-hidden bg-[#050507] pb-16 pt-32 sm:min-h-screen sm:items-center" aria-label="Featured story">
    <div className="absolute inset-0" aria-hidden="true">
      {hasArtwork ? <div data-hero-backdrop className="absolute -inset-[4%] transform-gpu"><Image src={backdrop(item?.backdrop_path, 'w1280')} alt="" fill priority sizes="100vw" className="object-cover" /></div> : <div data-hero-backdrop className="absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(0,242,254,0.16),transparent_30%),radial-gradient(circle_at_20%_75%,rgba(229,9,20,0.18),transparent_34%),linear-gradient(135deg,#050507,#0d111c_52%,#050507)]" />}
      <div data-hero-atmosphere className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/85 to-[#050507]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-black/35" />
    </div>
    <div data-hero-content className="relative z-10 mx-auto w-full max-w-[1440px] px-5 sm:px-6 lg:px-12"><div className="max-w-2xl">
      <p className="eyebrow">The Night Signal</p>
      <h1 className="hero-title mt-4">{title}</h1>
      {item ? <p className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-white/70">{yearOf(item) ? <span>{yearOf(item)}</span> : null}{item.vote_average ? <span>{item.vote_average.toFixed(1)} rating</span> : null}{mediaType ? <span>{mediaType}</span> : null}{genres.map((genre) => <span key={genre}>{genre}</span>)}</p> : null}
      <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">{overview}</p>
      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center"><Link href="/browse" className="btn-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Start Exploring</Link><Link href="#trending-tonight" className="inline-flex h-12 items-center rounded-full border border-white/20 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Trending Tonight</Link></div>
      <p className="mt-7 flex items-center gap-2 text-sm text-white/55"><kbd className="rounded border border-white/20 bg-white/5 px-2 py-1 font-mono text-xs text-white/80">/</kbd> Search the signal</p>
    </div></div>
  </section>
}
