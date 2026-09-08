'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Play } from 'lucide-react'
import { LandingSection } from './LandingSection'
import type { SeasonDetail, TVDetail } from '@/lib/tmdb'
import { backdrop } from '@/lib/tmdb'

export function EpisodeShowcase({ detail, season }: { detail?: TVDetail; season?: SeasonDetail }) {
  const root = useRef<HTMLDivElement>(null)
  const [selectedSeason, setSelectedSeason] = useState(season?.season_number)
  const showingLoadedSeason = selectedSeason === season?.season_number

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('[data-episode-reveal]', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 78%' } })
      })
      return () => media.revert()
    }, root)
    return () => context.revert()
  }, [])

  const seasons = detail?.seasons?.filter((entry) => entry.season_number >= 0) ?? []
  const title = detail?.name || detail?.title || 'this series'
  const detailHref = detail ? `/tv/${detail.id}` : '/tv'

  return <div ref={root}><LandingSection id="episode-guide" eyebrow="The episode guide" title="Every season. Every episode." description="Move through a series with the same practical detail available on every TV title.">
    {!season || !detail ? <div data-episode-reveal className="rounded-2xl border border-white/10 bg-[#0b111a] p-7 sm:p-9"><p className="font-display text-2xl font-bold text-white">Season information is unavailable right now.</p><p className="mt-2 max-w-xl text-sm leading-6 text-white/60">The TV catalog is still live, and a full episode guide appears when a title has season data.</p><Link href="/tv" className="mt-5 inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8f7d4]">Explore TV shows</Link></div> : <div className="grid gap-8 lg:grid-cols-[minmax(220px,.55fr)_minmax(0,1.45fr)]">
      <div data-episode-reveal className="lg:sticky lg:top-28 lg:self-start"><p className="font-display text-2xl font-bold text-white">{title}</p><div className="mt-5 flex flex-wrap gap-2" aria-label="Choose a season">{seasons.map((entry) => <button key={entry.id} type="button" aria-pressed={selectedSeason === entry.season_number} onClick={() => setSelectedSeason(entry.season_number)} className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75 hover:border-white/45 aria-pressed:border-[#b8f7d4] aria-pressed:bg-[#b8f7d4] aria-pressed:text-[#050507] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8f7d4]">{entry.name || `Season ${entry.season_number}`}</button>)}</div><p className="mt-5 text-sm leading-6 text-white/60">Episode details include original air dates, runtimes, and a short guide to what is waiting next.</p><Link href={detailHref} className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#b8f7d4] hover:underline">Open {title}<span aria-hidden="true">→</span></Link></div>
      {showingLoadedSeason ? <ol key={season.id} aria-label={`${season.name} episodes`} className="space-y-3">{season.episodes.map((episode) => <li key={episode.id} data-episode-reveal className="min-h-[132px] rounded-xl border border-white/10 bg-white/[0.03] p-3 sm:p-4"><div className="flex gap-4"><div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-white/[0.07] sm:w-40"><Image src={backdrop(episode.still_path, 'w500')} alt={episode.still_path ? `${episode.name} still` : ''} fill sizes="(max-width: 640px) 112px, 160px" className="object-cover" />{episode.still_path ? <span className="absolute inset-0 grid place-items-center bg-black/20"><Play className="size-4 text-white" fill="currentColor" aria-hidden="true" /></span> : null}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-white"><span className="mr-2 text-white/45">{episode.episode_number}.</span>{episode.name}</h3>{episode.runtime ? <span className="shrink-0 text-xs text-white/50">{episode.runtime}m</span> : null}</div><p className="mt-1 text-xs text-white/50">{episode.air_date ? new Date(`${episode.air_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Air date unavailable'}</p><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/65">{episode.overview || 'Episode overview is unavailable.'}</p></div></div></li>)}</ol> : <div key={selectedSeason} data-episode-reveal className="flex min-h-[320px] flex-col justify-center rounded-2xl border border-white/10 bg-[#0b111a] p-7"><p className="font-display text-xl font-bold text-white">This season guide is not loaded yet.</p><p className="mt-2 text-sm leading-6 text-white/60">Open the title for its current season and episode information.</p><Link href={detailHref} className="mt-5 text-sm font-semibold text-[#b8f7d4] hover:underline">View {title}</Link></div>}
    </div>}
  </LandingSection></div>
}
