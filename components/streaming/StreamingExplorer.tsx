'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Search, Tv2 } from 'lucide-react'
import { poster, providerLogo, titleOf, yearOf } from '@/lib/tmdb'
import type { Media, WatchProvider } from '@/lib/tmdb'

interface Props { providers: WatchProvider[]; initialItems: Media[] }

export function StreamingExplorer({ providers, initialItems }: Props) {
  const [active, setActive] = useState<WatchProvider | null>(null)
  const [query, setQuery] = useState('')
  const items = useMemo(() => query ? initialItems.filter((item) => titleOf(item).toLowerCase().includes(query.toLowerCase())) : initialItems, [initialItems, query])

  return (
    <main className="min-h-screen bg-background px-5 pb-20 pt-28 text-foreground md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-8 border-b border-border pb-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.24em] text-accent">Streaming index / US</p>
            <h1 className="font-display text-5xl font-bold tracking-[-0.05em] text-balance md:text-7xl">What&apos;s on your screen?</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Browse the latest signals by the service you already have. Every title links to its full VEYRA dossier.</p>
          </div>
          <label className="flex h-12 w-full items-center gap-3 border border-border bg-surface px-4 md:w-80">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Filter titles</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter titles" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </label>
        </div>

        <div className="mb-14 flex gap-3 overflow-x-auto pb-2" aria-label="Streaming providers">
          <button onClick={() => setActive(null)} className={`flex h-16 min-w-16 items-center justify-center border px-3 text-xs font-bold transition-colors ${!active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-muted-foreground hover:text-foreground'}`} aria-pressed={!active}>All</button>
          {providers.slice(0, 18).map((provider) => (
            <button key={provider.provider_id} onClick={() => setActive(provider)} className={`flex h-16 min-w-24 items-center gap-2 border px-3 transition-colors ${active?.provider_id === provider.provider_id ? 'border-primary bg-primary' : 'border-border bg-surface hover:border-foreground/40'}`} aria-pressed={active?.provider_id === provider.provider_id}>
              {provider.logo_path ? <Image src={providerLogo(provider.logo_path)} alt="" width={32} height={32} className="rounded-lg" /> : <Tv2 className="size-5" />}
              <span className="max-w-16 text-left text-xs font-semibold leading-tight">{provider.provider_name}</span>
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-2xl font-bold">{active?.provider_name ?? "Tonight's strongest signals"}</h2><span className="font-mono text-xs text-muted-foreground">{items.length} titles</span></div>
        {items.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">{items.map((item) => <Link key={`${item.media_type}-${item.id}`} href={`/${item.media_type === 'tv' ? 'tv' : 'movie'}/${item.id}`} className="group"><div className="relative aspect-[2/3] overflow-hidden bg-surface"><Image src={poster(item.poster_path)} alt={`${titleOf(item)} poster`} fill sizes="(max-width: 640px) 45vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div><div className="mt-3 flex items-start justify-between gap-3"><div><h3 className="font-semibold leading-tight group-hover:text-accent">{titleOf(item)}</h3><p className="mt-1 font-mono text-xs text-muted-foreground">{yearOf(item)}</p></div><ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" /></div></Link>)}</div> : <div className="border border-dashed border-border py-24 text-center text-muted-foreground">No titles match that filter.</div>}
        <p className="mt-20 max-w-2xl text-xs leading-5 text-muted-foreground">Availability is provided by JustWatch through TMDB. VEYRA does not host or sell content. Check your local service for final availability.</p>
      </div>
    </main>
  )
}
