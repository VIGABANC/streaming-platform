'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Film, Heart, Trash2 } from 'lucide-react'
import type { FavoriteItem, WatchlistItem } from '@/lib/store'
import { store } from '@/lib/store'

type LibraryItem = (WatchlistItem | FavoriteItem) & {
  media_type: string
  source?: string
  sourceId?: string | number
}

export function LibraryMediaCard({
  item,
  collection,
  onRemoved,
}: {
  item: LibraryItem
  collection: 'watchlist' | 'favorites'
  onRemoved: () => void
}) {
  const title = item.title || item.name || 'Untitled'
  const mediaType = String((item as unknown as { media_type: string }).media_type)
  const image = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '/poster-fallback.svg'
  const href = mediaType === 'anime'
    ? `/anime/${item.sourceId ?? item.id}`
    : `/${mediaType}/${item.id}`
  const remove = () => {
    if (mediaType !== 'anime') {
      if (collection === 'favorites') store.removeFromFavorites(item.id, mediaType as 'movie' | 'tv')
      else store.removeFromWatchlist(item.id, mediaType as 'movie' | 'tv')
    }
    onRemoved()
  }

  return (
    <article className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface/40">
      <Link href={href} className="block">
        <div className="relative aspect-[2/3]">
          <Image src={image} alt={`${title} poster`} fill sizes="(max-width: 640px) 50vw, 220px" className="object-cover" />
        </div>
        <div className="flex items-center gap-2 p-3">
          {mediaType === 'anime' ? <Film size={13} className="text-accent" /> : <Heart size={13} className="text-primary" />}
          <span className="truncate text-xs font-semibold text-white">{title}</span>
        </div>
      </Link>
      <button type="button" aria-label={`Remove ${title}`} onClick={remove} className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-black/70 text-white/80 hover:bg-primary hover:text-white">
        <Trash2 size={13} />
      </button>
      {collection === 'favorites' && <span className="sr-only">Favorite</span>}
    </article>
  )
}
