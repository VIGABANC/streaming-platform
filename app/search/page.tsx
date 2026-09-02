'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search as SearchIcon, X, Clock, AlertCircle, Sparkles } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaGrid } from '@/components/media/MediaGrid'
import { SkeletonGrid } from '@/components/feedback/Skeletons'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { Media, MediaType } from '@/lib/tmdb'

type SearchState = 'idle' | 'loading' | 'success' | 'empty' | 'error' | 'missing-config'
type SearchFilter = 'all' | 'movie' | 'tv'

const RECENT_SEARCHES_KEY = 'veyra-recent-searches'
const MAX_RECENT_SEARCHES = 8

function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [q, setQ] = useState(initialQuery)
  const [items, setItems] = useState<(Media & { media_type: MediaType })[]>([])
  const [filter, setFilter] = useState<SearchFilter>('all')
  const [state, setState] = useState<SearchState>(initialQuery ? 'loading' : 'idle')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (stored) {
        setRecentSearches(JSON.parse(stored))
      }
    } catch {
      // Ignore
    }
  }, [])

  const saveRecentSearch = useCallback((query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    try {
      setRecentSearches((prev) => {
        const existing = prev.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())
        const updated = [trimmed, ...existing].slice(0, MAX_RECENT_SEARCHES)
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
        return updated
      })
    } catch {
      // Ignore
    }
  }, [])

  const clearRecentSearches = () => {
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {
      // Ignore
    }
  }

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== inputRef.current &&
        !['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Sync with URL query parameter changes
  useEffect(() => {
    const paramQuery = searchParams.get('q') || ''
    setQ((prev) => (prev !== paramQuery ? paramQuery : prev))
  }, [searchParams])

  // Debounced search query
  useEffect(() => {
    const query = q.trim()
    const params = new URLSearchParams(window.location.search)

    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState(null, '', nextUrl)

    if (!query) {
      setItems([])
      setState('idle')
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setState('loading')
      try {
        const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const data = await res.json()

        if (!res.ok) {
          setItems([])
          setState(res.status === 503 ? 'missing-config' : 'error')
          return
        }

        // Filter out person media_types and cast to movie | tv
        const validResults: (Media & { media_type: MediaType })[] = (data.results ?? [])
          .filter((item: Media) => item.media_type === 'movie' || item.media_type === 'tv')
          .map((item: Media) => ({
            ...item,
            media_type: item.media_type as MediaType,
          }))

        setItems(validResults)
        setState(validResults.length > 0 ? 'success' : 'empty')

        if (validResults.length > 0) {
          saveRecentSearch(query)
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setItems([])
          setState('error')
        }
      }
    }, 320)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [q, saveRecentSearch])

  // Filtered items by category tab
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true
    return item.media_type === filter
  })

  return (
    <div className="px-5 pt-10 lg:px-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div>
        <p className="eyebrow">The Universal Finder</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white font-display md:text-5xl">
          Search
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Find any film, anime, or series instantly across the global catalog.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="mt-8 max-w-3xl">
        <label className="relative flex items-center rounded-2xl border border-white/10 bg-surface px-4 py-1.5 shadow-xl transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <SearchIcon className="text-muted-foreground ml-1" size={20} />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a movie title, series name, or franchise... (Press '/' to focus)"
            aria-label="Search movies and series"
            className="h-12 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-muted-foreground/70 outline-none"
            autoFocus
          />
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-white/50">
              /
            </kbd>
          )}
        </label>
      </div>

      {/* Filter Tabs (when searching or has results) */}
      {state === 'success' && items.length > 0 && (
        <div className="mt-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-muted-foreground hover:text-white'
              }`}
            >
              All Results ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('movie')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === 'movie'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-muted-foreground hover:text-white'
              }`}
            >
              Movies ({items.filter((i) => i.media_type === 'movie').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('tv')}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                filter === 'tv'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface text-muted-foreground hover:text-white'
              }`}
            >
              Series ({items.filter((i) => i.media_type === 'tv').length})
            </button>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Results for &ldquo;{q}&rdquo;
          </span>
        </div>
      )}

      {/* Content States */}
      <div className="mt-8 mb-16">
        {state === 'loading' && <SkeletonGrid count={12} />}

        {state === 'success' && (
          filteredItems.length > 0 ? (
            <MediaGrid items={filteredItems} />
          ) : (
            <EmptyState
              title={`No ${filter === 'movie' ? 'movies' : 'series'} found`}
              description={`We found matches in other categories for "${q}".`}
              action={
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                >
                  View All Results
                </button>
              }
            />
          )
        )}

        {state === 'empty' && (
          <EmptyState
            title={`No titles found for "${q}"`}
            description="Try checking for typos or searching for a broader title keyword."
          />
        )}

        {state === 'missing-config' && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center max-w-lg mx-auto">
            <h3 className="text-lg font-bold text-white font-display">Catalog not connected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">TMDB_API_KEY</code> to{' '}
              <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">.env.local</code> to activate multi-search.
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center max-w-lg mx-auto">
            <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
            <h3 className="text-lg font-bold text-white font-display">Search Encountered an Error</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn&apos;t reach the catalog right now. Please check your network connection and try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"
            >
              Retry
            </button>
          </div>
        )}

        {state === 'idle' && (
          <div className="space-y-10">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Clock size={14} />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-white transition-colors"
                  >
                    Clear history
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setQ(term)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-4 py-2 text-xs font-medium text-white/80 hover:border-primary hover:text-white transition-colors"
                    >
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Searches */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                <Sparkles size={14} className="text-accent" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Spider-Man', 'Avatar', 'Dune', 'Batman', 'One Piece', 'Breaking Bad', 'The Last of Us', 'Interstellar'].map((suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => setQ(suggested)}
                    className="rounded-full border border-white/10 bg-surface/60 px-4 py-2 text-xs text-white/80 hover:border-primary hover:text-white transition-colors"
                  >
                    {suggested}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Shell>
      <Suspense fallback={<SkeletonGrid count={12} />}>
        <SearchContent />
      </Suspense>
    </Shell>
  )
}
