'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Bookmark, Heart, Film, Tv, Plus } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaGrid } from '@/components/media/MediaGrid'
import { EmptyState } from '@/components/feedback/EmptyState'
import { store, subscribeToStorageChanges, type WatchlistItem, type FavoriteItem } from '@/lib/store'
import type { Media, MediaType } from '@/lib/tmdb'

type ListTab = 'all' | 'movies' | 'tv' | 'favorites'

export default function MyListPage() {
  const [activeTab, setActiveTab] = useState<ListTab>('all')
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [mounted, setMounted] = useState(false)

  const reloadData = () => {
    setWatchlist(store.getWatchlist())
    setFavorites(store.getFavorites())
  }

  useEffect(() => {
    reloadData()
    setMounted(true)

    const unSubWatch = subscribeToStorageChanges('veyra-watchlist', reloadData)
    const unSubFav = subscribeToStorageChanges('veyra-favorites', reloadData)

    return () => {
      unSubWatch()
      unSubFav()
    }
  }, [])

  // Filter items based on active tab
  let displayItems: (Media & { media_type: MediaType })[] = []

  if (activeTab === 'favorites') {
    displayItems = favorites.map((item) => ({
      ...item,
      media_type: item.media_type,
    }))
  } else if (activeTab === 'movies') {
    displayItems = watchlist
      .filter((i) => i.media_type === 'movie')
      .map((item) => ({ ...item, media_type: 'movie' as const }))
  } else if (activeTab === 'tv') {
    displayItems = watchlist
      .filter((i) => i.media_type === 'tv')
      .map((item) => ({ ...item, media_type: 'tv' as const }))
  } else {
    displayItems = watchlist.map((item) => ({
      ...item,
      media_type: item.media_type,
    }))
  }

  return (
    <Shell>
      <div className="px-5 pt-10 lg:px-8 max-w-[1440px] mx-auto">
        <div>
          <p className="eyebrow">Your Private Collection</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white font-display md:text-5xl">
            My List
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Saved movies, TV series, and personal favorites.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-surface text-muted-foreground hover:text-white'
            }`}
          >
            <Bookmark size={14} />
            <span>All Saved ({watchlist.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('movies')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'movies'
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-surface text-muted-foreground hover:text-white'
            }`}
          >
            <Film size={14} />
            <span>Movies ({watchlist.filter((i) => i.media_type === 'movie').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tv')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'tv'
                ? 'bg-primary text-primary-foreground shadow'
                : 'bg-surface text-muted-foreground hover:text-white'
            }`}
          >
            <Tv size={14} />
            <span>Series ({watchlist.filter((i) => i.media_type === 'tv').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'favorites'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-surface text-muted-foreground hover:text-white'
            }`}
          >
            <Heart size={14} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} />
            <span>Favorites ({favorites.length})</span>
          </button>
        </div>

        {/* List Content */}
        <div className="mt-8 mb-16">
          {!mounted ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading your collection…
            </div>
          ) : displayItems.length > 0 ? (
            <MediaGrid items={displayItems} />
          ) : (
            <EmptyState
              title={
                activeTab === 'favorites'
                  ? 'No favorites yet'
                  : activeTab === 'movies'
                  ? 'No movies saved to your list'
                  : activeTab === 'tv'
                  ? 'No series saved to your list'
                  : 'Your list is quiet'
              }
              description="Click '+ Add to List' or the heart icon on any movie or series to keep it here for quick access."
              action={
                <div className="flex gap-3">
                  <Link
                    href="/movies"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Film size={14} />
                    <span>Explore Movies</span>
                  </Link>
                  <Link
                    href="/tv"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface px-5 py-2.5 text-xs font-semibold text-white hover:border-primary transition-colors"
                  >
                    <Tv size={14} />
                    <span>Explore TV Shows</span>
                  </Link>
                </div>
              }
            />
          )}
        </div>
      </div>
    </Shell>
  )
}
