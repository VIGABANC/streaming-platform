'use client'

import { useEffect, useState } from 'react'
import { Bookmark, Check, Play } from 'lucide-react'
import { store, showToast, type WatchlistItem } from '@/lib/store'
import type { AnimeDetail } from '@/lib/anilist'

export function AnimeDetailActions({ item }: { item: AnimeDetail }) {
  const [saved, setSaved] = useState(false)
  useEffect(() => setSaved(store.isInWatchlist(item.sourceId, 'anime', item)), [item])
  const toggle = () => {
    const libraryItem: WatchlistItem = { id: item.sourceId, media_type: 'anime', title: item.title, poster_path: item.posterUrl, overview: item.description, addedAt: Date.now(), source: 'anilist', sourceId: item.sourceId, kind: 'anime' }
    store.toggleWatchlist(libraryItem)
    setSaved((current) => !current)
    showToast({ title: saved ? 'Removed from Watchlist' : 'Added to Watchlist', description: item.title, type: saved ? 'info' : 'success' })
  }
  return (
    <div className="mt-7 flex flex-wrap gap-3">
      <button type="button" onClick={toggle} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-white hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved to Watchlist' : 'Add to Watchlist'}</button>
      {item.trailer && <a href={`https://www.youtube.com/watch?v=${item.trailer.videoId}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-xs font-semibold text-white hover:border-white/30"><Play size={15} />Watch YouTube trailer</a>}
      {saved && <span className="inline-flex min-h-11 items-center gap-2 px-2 text-xs text-accent"><Check size={14} />Stored on this device</span>}
    </div>
  )
}
