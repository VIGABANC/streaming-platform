'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Play, Clock, X } from 'lucide-react'
import { store, type ContinueWatchingItem } from '@/lib/store'
import { poster } from '@/lib/tmdb'
import { formatDate } from '@/lib/utils'

export function ContinueWatchingRail() {
  const [items, setItems] = useState<ContinueWatchingItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  const loadItems = () => {
    setItems(store.getContinueWatching())
    setHydrated(true)
  }

  useEffect(() => {
    loadItems()
    // Sync across tabs
    const handler = (e: StorageEvent) => {
      if (e.key === 'veyra-continue-watching') loadItems()
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  if (!hydrated || items.length === 0) return null

  const remove = (id: number, mediaType: 'movie' | 'tv') => {
    store.removeFromContinueWatching(id, mediaType)
    loadItems()
  }

  return (
    <section className="mt-10" aria-label="Continue Watching">
      <div className="mb-4 flex items-center gap-3 px-5 lg:px-8">
        <span aria-hidden="true" className="h-px w-6 bg-accent rounded-full" />
        <h2 className="section-title">Continue watching</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar lg:gap-4 lg:px-8">
        {items.map((item) => {
          const href =
            item.media_type === 'tv' && item.season && item.episode
              ? `/watch/tv/${item.id}/${item.season}/${item.episode}`
              : `/watch/movie/${item.id}`

          const imgSrc = poster(item.backdrop_path ?? item.poster_path, 'w780')

          return (
            <article
              key={`${item.id}-${item.media_type}`}
              className="group relative w-64 shrink-0"
            >
              <Link
                href={href}
                aria-label={`Continue watching: ${item.title}`}
                className="block overflow-hidden rounded-xl bg-surface focus-visible:outline-primary"
              >
                <div className="relative aspect-video">
                  <Image
                    src={imgSrc}
                    alt=""
                    fill
                    sizes="256px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="grid size-12 place-items-center rounded-full bg-primary/90">
                      <Play size={18} fill="currentColor" className="text-primary-foreground ml-0.5" aria-hidden="true" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                  {item.media_type === 'tv' && item.season && item.episode && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      S{item.season} · E{item.episode}
                      {item.episodeTitle && ` · ${item.episodeTitle}`}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock size={10} aria-hidden="true" />
                    {formatDate(new Date(item.lastOpenedAt).toISOString().slice(0, 10))}
                  </p>
                </div>
              </Link>

              {/* Remove button */}
              <button
                type="button"
                aria-label={`Remove ${item.title} from continue watching`}
                onClick={() => remove(item.id, item.media_type)}
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/90 focus-visible:opacity-100"
              >
                <X size={12} />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
