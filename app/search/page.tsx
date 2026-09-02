'use client'

import { useEffect, useState } from 'react'
import { Search as SearchIcon, X } from 'lucide-react'
import { MediaCard, Shell } from '@/components/luma'
import { Media } from '@/lib/tmdb'

type SearchState = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'missing-config'

export default function Search() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Media[]>([])
  const [state, setState] = useState<SearchState>('idle')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setQ(new URLSearchParams(window.location.search).get('q') ?? '')
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const query = q.trim()
    const params = new URLSearchParams(window.location.search)
    if (query) params.set('q', query)
    else params.delete('q')
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`
    window.history.replaceState(null, '', next)

    if (!query) {
      setItems([])
      setState('idle')
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setState('loading')
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`, { signal: controller.signal })
        const data = await response.json()
        if (!response.ok) {
          setItems([])
          setState(response.status === 503 ? 'missing-config' : 'error')
          return
        }
        const results = (data.results ?? []).filter((item: Media) => item.media_type === 'movie' || item.media_type === 'tv')
        setItems(results)
        setState(results.length ? 'success' : 'empty')
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setItems([])
          setState('error')
        }
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [q])

  return <Shell>
    <div className="px-5 pt-14 lg:px-8">
      <p className="eyebrow">Find your next signal</p>
      <h1 className="mt-3 text-5xl font-black tracking-[-.06em] text-white">Search</h1>
      <label className="mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 focus-within:border-primary">
        <SearchIcon className="text-muted-foreground" size={20} />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search movies and series" aria-label="Search movies and series" className="h-14 flex-1 bg-transparent text-white outline-none placeholder:text-muted-foreground" />
        {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white"><X size={16} /></button>}
      </label>
      {q && <p className="mt-6 text-sm text-muted-foreground">{state === 'loading' ? 'Searching the catalog…' : state === 'success' ? `${items.length} titles for “${q}”` : `Search results for “${q}”`}</p>}
    </div>
    {state === 'success' && <div className="mt-6 grid grid-cols-2 gap-4 px-5 sm:grid-cols-4 lg:grid-cols-6 lg:px-8">{items.map((item, i) => <MediaCard key={`${item.id}-${item.media_type}-${i}`} item={item} />)}</div>}
    <div className="p-8 text-center text-sm text-muted-foreground">
      {state === 'loading' && 'Searching…'}
      {state === 'idle' && 'Start with a title, genre, or mood.'}
      {state === 'empty' && <>No titles found for “{q}”.</>}
      {state === 'missing-config' && <><strong className="block text-white">Catalog not connected</strong><span>TMDB configuration is required.</span></>}
      {state === 'error' && <><strong className="block text-white">We couldn&apos;t search the catalog.</strong><span className="block">Try again in a moment.</span><button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground">Retry</button></>}
    </div>
  </Shell>
}
