'use client'

import Image from 'next/image'
import Link from 'next/link'
import { type FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Search, Star, X } from 'lucide-react'
import type { Media } from '@/lib/tmdb'
import { LandingSection } from '@/components/landing/LandingSection'
import { normalizeSearchResults, searchShowcaseStatus, type SearchShowcaseResult, type SearchShowcaseState } from './search-showcase-data'

gsap.registerPlugin(ScrollTrigger)

const DISPLAY_LIMIT = 4

function imageSource(path?: string | null) { return path ? `https://image.tmdb.org/t/p/w185${path}` : '/poster-fallback.svg' }
function titleOf(item: Media) { return item.title || item.name || 'Untitled' }
function yearOf(item: Media) { return (item.release_date || item.first_air_date || '').slice(0, 4) }

export function SearchShowcase({ initialItems }: { initialItems: Media[] }) {
  const root = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<SearchShowcaseResult[]>([])
  const [state, setState] = useState<SearchShowcaseState>('idle')
  const [requestNonce, setRequestNonce] = useState(0)

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      const media = gsap.matchMedia()
      media.add('(prefers-reduced-motion: reduce)', () => gsap.set('[data-finder-reveal]', { clearProps: 'all', autoAlpha: 1 }))
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo('[data-finder-reveal]', { autoAlpha: 0, y: 24, scale: 0.985 }, {
          autoAlpha: 1, y: 0, scale: 1, duration: 0.65, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: 'top 78%' },
        })
      })
      return () => media.revert()
    }, root)
    return () => context.revert()
  }, [])

  useEffect(() => {
    const focusFinder = (event: KeyboardEvent) => {
      const active = document.activeElement?.tagName.toLowerCase()
      if (event.key === '/' && active !== 'input' && active !== 'textarea' && active !== 'select') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusFinder)
    return () => window.removeEventListener('keydown', focusFinder)
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (!term || term.length < 2) { setItems([]); setState('idle'); return }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setState('loading')
      try {
        // The established API contract uses `query`; `/search` alone owns its `q` URL state.
        const response = await fetch(`/api/search?query=${encodeURIComponent(term)}`, { signal: controller.signal })
        const payload: unknown = await response.json()
        if (!response.ok) throw new Error('Search request failed')
        const results = normalizeSearchResults(payload)
        setItems(results)
        setState(results.length ? 'results' : 'empty')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') { setItems([]); setState('error') }
      }
    }, 320)
    return () => { controller.abort(); window.clearTimeout(timer) }
  }, [query, requestNonce])

  const visibleItems = items.slice(0, DISPLAY_LIMIT)
  const idleItems = initialItems.filter((item) => item.id && (item.media_type === 'movie' || item.media_type === 'tv')).slice(0, 3) as SearchShowcaseResult[]
  const status = searchShowcaseStatus(state, items.length, query.trim())
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (query.trim().length >= 2) setRequestNonce((value) => value + 1) }

  return <div ref={root}>
    <LandingSection id="universal-finder" eyebrow="The universal finder" title="Search less. Find faster." description="A live signal into the same catalog search, ready whenever a title is on your mind.">
      <div data-finder-reveal className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_0.8fr] lg:items-start">
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#0b111a] p-4 shadow-2xl sm:p-6" role="search">
          <label htmlFor="landing-search" className="text-sm font-semibold text-white">Search the catalog</label>
          <div className="mt-3 flex min-h-12 items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 focus-within:border-[#b8f7d4] focus-within:ring-2 focus-within:ring-[#b8f7d4]/20">
            <Search className="size-5 shrink-0 text-white/50" aria-hidden="true" />
            <input ref={inputRef} id="landing-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a movie, series, or franchise" aria-describedby="landing-search-status" className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
            {query ? <button type="button" onClick={() => { setQuery(''); inputRef.current?.focus() }} className="grid size-10 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8f7d4]" aria-label="Clear landing search"><X className="size-4" /></button> : <kbd className="rounded border border-white/15 px-1.5 py-0.5 font-mono text-[10px] text-white/50">/</kbd>}
          </div>
          <p id="landing-search-status" aria-live="polite" className="mt-3 min-h-5 text-xs text-white/60">{status}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="submit" className="inline-flex min-h-11 items-center rounded-full bg-[#b8f7d4] px-5 text-xs font-bold text-[#050507] hover:bg-[#d2ffe7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8f7d4]">Find a signal</button>
            <Link href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search'} className="inline-flex min-h-11 items-center gap-1 rounded-full border border-white/20 px-5 text-xs font-semibold text-white hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8f7d4]">Open full search <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link>
          </div>
        </form>
        <div data-search-showcase-results className="min-h-[220px] rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          {state === 'loading' && <div className="space-y-3" aria-label="Loading search results">{[0, 1, 2].map((item) => <div key={item} className="flex animate-pulse gap-3"><div className="h-16 w-11 rounded bg-white/10" /><div className="flex-1 space-y-2 py-2"><div className="h-3 w-2/3 rounded bg-white/10" /><div className="h-2 w-1/3 rounded bg-white/5" /></div></div>)}</div>}
          {state === 'results' && <ResultList items={visibleItems} />}
          {state === 'empty' && <Empty title="No signals found" copy="Try a broader title, or browse what is live tonight." link="/browse" action="Browse the catalog" />}
          {state === 'error' && <div className="flex min-h-[180px] flex-col justify-center"><p className="font-display text-xl font-bold text-white">Search unavailable</p><p className="mt-2 text-sm text-white/60">We could not reach the catalog. Your query has been kept.</p><div className="mt-4 flex gap-4"><button type="button" onClick={() => setRequestNonce((value) => value + 1)} className="text-sm font-semibold text-[#b8f7d4] underline-offset-4 hover:underline">Retry</button><Link href={query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : '/search'} className="text-sm font-semibold text-[#b8f7d4] underline-offset-4 hover:underline">Open full search</Link></div></div>}
          {state === 'idle' && (idleItems.length ? <><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Popular signals</p><div className="mt-3"><ResultList items={idleItems} /></div></> : <Empty title="The finder is standing by." copy="Enter a title to search the live catalog." link="/search" action="Open full search" />)}
        </div>
      </div>
    </LandingSection>
  </div>
}

function Empty({ title, copy, link, action }: { title: string; copy: string; link: string; action: string }) { return <div className="flex min-h-[180px] flex-col justify-center"><p className="font-display text-xl font-bold text-white">{title}</p><p className="mt-2 text-sm text-white/60">{copy}</p><Link href={link} className="mt-4 text-sm font-semibold text-[#b8f7d4] underline-offset-4 hover:underline">{action}</Link></div> }
function ResultList({ items }: { items: SearchShowcaseResult[] }) { return <ul className="space-y-2" aria-label="Search results">{items.map((item) => <li key={`${item.media_type}-${item.id}`}><Link href={`/${item.media_type}/${item.id}`} className="flex min-h-16 items-center gap-3 rounded-lg p-2 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8f7d4]"><Image src={imageSource(item.poster_path)} alt="" width={40} height={60} sizes="40px" className="h-14 w-10 rounded object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-white">{titleOf(item)}</span><span className="mt-1 flex items-center gap-2 text-[11px] text-white/55"><span>{item.media_type === 'tv' ? 'TV' : 'Film'}</span><span>{yearOf(item) || '—'}</span>{item.vote_average ? <span className="ml-auto inline-flex items-center gap-1 text-amber-300"><Star className="size-3" fill="currentColor" aria-hidden="true" />{item.vote_average.toFixed(1)}</span> : null}</span></span></Link></li>)}</ul> }
