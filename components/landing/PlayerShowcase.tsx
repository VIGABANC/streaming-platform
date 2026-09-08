'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { AlertTriangle, Play, RotateCcw, Wifi } from 'lucide-react'
import { LandingSection } from './LandingSection'
import { titleOf, type Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

export function PlayerShowcase({ item }: { item?: Media }) {
  const root = useRef<HTMLDivElement>(null)
  const watchHref = item ? (item.media_type === 'tv' ? `/watch/tv/${item.id}/1/1` : `/watch/movie/${item.id}`) : undefined
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => gsap.set('[data-player-progress]', { width: '38%' }))
      media.add('(prefers-reduced-motion: no-preference)', () => gsap.fromTo('[data-player-progress]', { width: 0 }, { width: '38%', duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: root.current, start: 'top 80%', once: true } }))
      return () => media.revert()
    }, root)
    return () => context.revert()
  }, [])
  return <div ref={root}><LandingSection id="player-experience" eyebrow="The playback handoff" title="From discovery to play." description="A clear handoff to the available playback route, with recovery states kept in view."><div className="mx-auto max-w-5xl"><div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0b111a] shadow-2xl"><div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_15%,rgba(184,247,212,.16),transparent_34%),linear-gradient(145deg,#111b29,#050507_70%)]" /><div className="absolute inset-x-0 bottom-0 p-5 sm:p-8"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b8f7d4]">Illustrative player state</p><p className="mt-2 font-display text-xl font-bold text-white">{item ? titleOf(item) : 'Choose a title to begin'}</p></div><span className="grid size-12 place-items-center rounded-full bg-white text-[#050507]"><Play className="ml-0.5 size-5" fill="currentColor" aria-hidden="true" /></span></div><div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/15"><div data-player-progress className="h-full w-[38%] rounded-full bg-[#b8f7d4]" /></div><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/65"><span className="inline-flex items-center gap-1"><Wifi className="size-3.5" />Connecting to a provider</span><span className="inline-flex items-center gap-1"><AlertTriangle className="size-3.5" />Timeout warning</span><span className="inline-flex items-center gap-1"><RotateCcw className="size-3.5" />Retry or switch provider</span></div></div></div><p className="mt-4 text-center text-xs leading-5 text-white/50">VEYRA does not host or store video media. Playback is provided by third-party providers.</p>{watchHref ? <div className="mt-5 text-center"><Link href={watchHref} className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white hover:border-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8f7d4]">Open playback for {titleOf(item!)}</Link></div> : <div className="mt-5 text-center"><Link href="/browse" className="text-sm font-semibold text-[#b8f7d4] hover:underline">Find a title to play</Link></div>}</div></LandingSection></div>
}
