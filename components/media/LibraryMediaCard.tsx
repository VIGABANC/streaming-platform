'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { poster } from '@/lib/tmdb'
import { libraryMediaHref } from '@/lib/media/library'
import { store, type FavoriteItem, type WatchlistItem } from '@/lib/store'

type LibraryItem = WatchlistItem | FavoriteItem

interface LibraryMediaCardProps {
  item: LibraryItem
  collection: 'watchlist' | 'favorites'
  onRemoved: () => void
}

export function LibraryMediaCard({ item, collection, onRemoved }: LibraryMediaCardProps) {
  const title = item.title ?? item.name ?? 'Untitled signal'
  const href = libraryMediaHref(item)
  const image = item.source === 'anilist' && item.poster_path?.startsWith('http')
    ? item.poster_path
    : poster(item.poster_path, 'w342')

  const remove = () => {
    if (collection === 'favorites') {
      store.removeFromFavorites(item.id, item.media_type, item)
    } else {
      store.removeFromWatchlist(item.id, item.media_type, item)
    }
    onRemoved()
  }

  return (
    <article className="group relative min-w-0">
      <Link
        href={href}
        aria-label={`${title} — view details`}
        className="block overflow-hidden rounded-xl bg-[#0A0D14] shadow-lg ring-1 ring-white/8 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={image}
            alt={`${title} poster`}
            fill
            sizes="(max-width: 640px) 145px, (max-width: 1024px) 170px, 190px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/80">
              {item.media_type === 'anime' ? 'Anime' : item.media_type === 'tv' ? 'TV' : 'Film'}
            </span>
          </div>
        </div>
        <div className="p-2.5">
          <p className="truncate text-xs font-semibold leading-snug text-white">{title}</p>
        </div>
      </Link>
      <button
        type="button"
        aria-label={`Remove ${title} from ${collection}`}
        onClick={remove}
        className="absolute right-2 top-2 grid size-10 touch-target place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-primary"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </article>
  )
}
