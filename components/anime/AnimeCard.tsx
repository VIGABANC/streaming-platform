'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, Plus, Star } from 'lucide-react'
import { store, showToast, type WatchlistItem } from '@/lib/store'
import type { AnimeListItem } from '@/lib/anilist'

interface AnimeCardProps {
  item: AnimeListItem
  priority?: boolean
}

export function AnimeCard({ item, priority = false }: AnimeCardProps) {
  const title = item.title
  const [inWatchlist, setInWatchlist] = useState(false)
  useEffect(() => {
    setInWatchlist(store.isInWatchlist(item.sourceId, 'anime', item))
  }, [item])

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const next = !inWatchlist
    const libraryItem: WatchlistItem = {
      id: item.sourceId,
      media_type: 'anime',
      title,
      poster_path: item.posterUrl,
      overview: item.description,
      addedAt: Date.now(),
      source: 'anilist',
      sourceId: item.sourceId,
      kind: 'anime',
    }
    store.toggleWatchlist(libraryItem)
    setInWatchlist(next)
    showToast({ title: next ? 'Added to Watchlist' : 'Removed from Watchlist', description: title, type: next ? 'success' : 'info' })
  }

  return (
    <article className="group relative min-w-0 w-[145px] shrink-0 sm:w-[170px] lg:w-[190px]">
      <Link href={`/anime/${item.sourceId}`} aria-label={`${title} — view anime details`} className="block overflow-hidden rounded-xl bg-[#0A0D14] shadow-lg ring-1 ring-white/8 outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image src={item.posterUrl || '/poster-fallback.svg'} alt={`${title} poster`} fill sizes="(max-width: 640px) 145px, (max-width: 1024px) 170px, 190px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" priority={priority} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">Anime</span>
          </div>
        </div>
        <div className="p-2.5 pt-2">
          <p className="truncate text-xs font-semibold leading-snug text-white">{title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            <span>{item.year || '—'}</span>
            {item.score ? <span className="flex items-center gap-0.5 font-semibold text-amber-400"><Star size={10} fill="currentColor" /><span>{item.score.toFixed(1)}</span></span> : null}
          </div>
        </div>
      </Link>
      <button type="button" aria-label={`${inWatchlist ? 'Remove' : 'Add'} ${title} ${inWatchlist ? 'from' : 'to'} watchlist`} onClick={toggle} className={`absolute right-2 top-2 grid size-11 touch-target place-items-center rounded-full backdrop-blur-md opacity-0 transition-all group-hover:opacity-100 focus-visible:opacity-100 hover:scale-110 ${inWatchlist ? 'bg-primary text-white' : 'bg-black/60 text-white/80 hover:bg-primary hover:text-white'}`}>
        {inWatchlist ? <Check size={14} /> : <Plus size={14} />}
      </button>
    </article>
  )
}
