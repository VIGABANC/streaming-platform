'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Clock3, Star } from 'lucide-react'
import { TrailerModal } from '@/components/media/TrailerModal'
import { LandingSection } from '@/components/landing/LandingSection'
import { formatRuntime } from '@/lib/utils'
import type { MovieDetail, TVDetail, WatchProvider } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

function titleOf(detail: MovieDetail | TVDetail) { return detail.title || detail.name || 'Untitled' }
function yearOf(detail: MovieDetail | TVDetail) { return (detail.release_date || detail.first_air_date || '').slice(0, 4) }
function backdropSource(path?: string | null) { return path ? `https://image.tmdb.org/t/p/w1280${path}` : '/backdrop-fallback.svg' }
function posterSource(path?: string | null) { return path ? `https://image.tmdb.org/t/p/w342${path}` : '/poster-fallback.svg' }

export function DetailShowcase({ detail, providers = [] }: { detail?: MovieDetail | TVDetail; providers?: WatchProvider[] }) {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => gsap.set('[data-detail-reveal]', { clearProps: 'all', autoAlpha: 1 }))
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('[data-detail-reveal]', { autoAlpha: 0, y: 28, scale: 0.99 }, {
          autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: 'power2.out', stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: 'top 78%' },
        })
      })
      return () => media.revert()
    }, root)
    return () => context.revert()
  }, [])

  if (!detail) return <div ref={root}><LandingSection id="detail-experience" eyebrow="The detail signal" title="Every signal has a story." description="When a title is available, VEYRA brings its essentials into focus before you decide."><div data-detail-reveal className="rounded-2xl border border-white/10 bg-[#0b111a] p-8"><p className="font-display text-2xl font-bold text-white">Detail signal unavailable</p><p className="mt-2 max-w-xl text-sm leading-6 text-white/60">We could not load a representative title right now. The live catalog is still available to explore.</p><Link href="/browse" className="mt-5 inline-flex min-h-11 items-center gap-1 rounded-full border border-white/20 px-5 text-xs font-semibold text-white hover:border-white/50">Browse the catalog <ArrowUpRight className="size-3.5" /></Link></div></LandingSection></div>

  const title = titleOf(detail)
  const type = detail.media_type === 'tv' ? 'TV series' : 'Film'
  const trailer = detail.videos?.results.find((video) => video.site === 'YouTube' && video.type === 'Trailer')
  const cast = detail.credits?.cast.slice(0, 4).map((person) => person.name) ?? []
  const runtime = detail.media_type === 'movie' ? formatRuntime(detail.runtime) : ''
  const href = `/${detail.media_type}/${detail.id}`

  return <div ref={root}><LandingSection id="detail-experience" eyebrow="The detail signal" title="Go beyond the poster." description="A closer look at the people, mood, and practical details behind a title.">
    <article data-detail-reveal className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-[#0b111a] shadow-2xl">
      <Image src={backdropSource(detail.backdrop_path)} alt="" fill sizes="(max-width: 1440px) 100vw, 1440px" className="-z-20 object-cover opacity-45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#050507] via-[#050507]/85 to-[#050507]/35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/30" />
      <div className="grid gap-7 p-5 sm:p-8 md:grid-cols-[150px_minmax(0,1fr)] lg:p-10">
        <div className="relative hidden aspect-[2/3] overflow-hidden rounded-xl border border-white/15 bg-black/30 shadow-2xl md:block"><Image src={posterSource(detail.poster_path)} alt={`${title} poster`} fill sizes="150px" className="object-cover" /></div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#b8f7d4]">{type}</p>
          <h3 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">{title}</h3>
          {detail.tagline ? <p className="mt-2 text-sm italic text-white/75">“{detail.tagline}”</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/75"><span>{yearOf(detail) || 'Year unavailable'}</span>{detail.vote_average ? <span className="inline-flex items-center gap-1 text-amber-300"><Star className="size-3.5" fill="currentColor" />{detail.vote_average.toFixed(1)}</span> : null}{runtime ? <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{runtime}</span> : null}</div>
          {detail.genres?.length ? <div className="mt-4 flex flex-wrap gap-2">{detail.genres.slice(0, 4).map((genre) => <span key={genre.id} className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] text-white/80">{genre.name}</span>)}</div> : null}
          <p className="mt-5 max-w-2xl text-sm leading-6 text-white/75">{detail.overview || 'A full story profile is available in the live catalog.'}</p>
          {cast.length ? <p className="mt-4 text-xs text-white/60"><span className="font-semibold text-white/80">Cast:</span> {cast.join(' · ')}</p> : null}
          {providers.length ? <p className="mt-3 text-xs text-white/60"><span className="font-semibold text-white/80">Provider signals:</span> {providers.slice(0, 4).map((provider) => provider.provider_name).join(' · ')}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3"><Link href={href} className="inline-flex min-h-11 items-center gap-1 rounded-full bg-[#b8f7d4] px-5 text-xs font-bold text-[#050507] hover:bg-[#d2ffe7]">Open title <ArrowUpRight className="size-3.5" /></Link>{trailer ? <TrailerModal trailerKey={trailer.key} title={title} /> : null}</div>
        </div>
      </div>
    </article>
  </LandingSection></div>
}
