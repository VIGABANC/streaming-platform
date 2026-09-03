'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Film, Tv, ArrowUpDown, Trash2, Play } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaCard } from '@/components/media/MediaCard'
import { store, subscribeToStorageChanges, type FavoriteItem, showToast } from '@/lib/store'
import type { MediaType } from '@/lib/tmdb'

type FilterType = 'all' | 'movie' | 'tv'
type SortOrder = 'newest' | 'oldest' | 'rating' | 'title'

export default function FavoritesPage() {
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortOrder>('newest')
  const [mounted, setMounted] = useState(false)

  const reload = () => {
    setItems(store.getFavorites())
  }

  useEffect(() => {
    setMounted(true)
    reload()
    return subscribeToStorageChanges('veyra-favorites', reload)
  }, [])

  const handleClearAll = () => {
    if (items.length === 0) return
    const prev = [...items]
    items.forEach((i) => store.removeFromFavorites(i.id, i.media_type))
    reload()
    showToast({
      title: 'Cleared all favorites',
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => {
          prev.forEach((item) => store.addToFavorites(item))
          reload()
        },
      },
    })
  }

  // Filter
  const filtered = items.filter((i) => {
    if (filter === 'all') return true
    return i.media_type === filter
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'newest') return (b.favoritedAt || 0) - (a.favoritedAt || 0)
    if (sort === 'oldest') return (a.favoritedAt || 0) - (b.favoritedAt || 0)
    if (sort === 'rating') return (b.vote_average || 0) - (a.vote_average || 0)
    if (sort === 'title') {
      const titleA = a.title || a.name || ''
      const titleB = b.title || b.name || ''
      return titleA.localeCompare(titleB)
    }
    return 0
  })

  const movieCount = items.filter((i) => i.media_type === 'movie').length
  const tvCount = items.filter((i) => i.media_type === 'tv').length

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-12">
        {/* Header banner */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <Heart size={18} fill="currentColor" />
              <p className="eyebrow text-rose-500">Curated Collection</p>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              My Favorites
            </h1>
            <p className="mt-1 text-xs text-white/60">
              {mounted ? `${items.length} titles in your personal hall of fame` : 'Loading favorites…'}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 transition-colors self-start sm:self-auto"
            >
              <Trash2 size={13} />
              <span>Clear Favorites</span>
            </button>
          )}
        </div>

        {/* Filter and Sort Toolbar */}
        {mounted && items.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                All ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('movie')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === 'movie'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Film size={12} />
                <span>Movies ({movieCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('tv')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  filter === 'tv'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Tv size={12} />
                <span>Series ({tvCount})</span>
              </button>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-2 text-xs text-white/70">
              <ArrowUpDown size={13} className="text-white/50" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOrder)}
                className="rounded-lg border border-white/10 bg-[#0A0D14] px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-rose-500"
              >
                <option value="newest">Recently Added</option>
                <option value="oldest">First Added</option>
                <option value="rating">Highest Rated</option>
                <option value="title">Title (A-Z)</option>
              </select>
            </div>
          </div>
        )}

        {/* Empty state */}
        {mounted && items.length === 0 && (
          <div className="flex min-h-[45vh] flex-col items-center justify-center text-center p-8">
            <div className="grid size-16 place-items-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 mb-4 shadow-xl">
              <Heart size={30} />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Your favorites list is empty</h2>
            <p className="mt-2 text-xs text-white/60 max-w-sm">
              Tap the heart icon on any movie or series detail page to keep track of the stories you love most.
            </p>
            <Link
              href="/movies"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105"
            >
              <Play size={14} fill="currentColor" />
              <span>Explore Catalog</span>
            </Link>
          </div>
        )}

        {/* Grid */}
        {mounted && sorted.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-4">
            {sorted.map((item) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                item={{
                  ...item,
                  media_type: item.media_type as MediaType,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Shell>
  )
}
