'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { LandingSection } from './LandingSection'
import { store, subscribeToStorageChanges, type ContinueWatchingItem, type FavoriteItem, type WatchlistItem } from '@/lib/store'
import { poster } from '@/lib/tmdb'

type LibraryState = { continueWatching: ContinueWatchingItem[]; watchlist: WatchlistItem[]; favorites: FavoriteItem[] }
const emptyState: LibraryState = { continueWatching: [], watchlist: [], favorites: [] }
function hrefFor(item: ContinueWatchingItem): string | undefined {
  if (item.media_type === 'movie') return `/watch/movie/${item.id}`
  return item.season !== undefined && item.episode !== undefined
    ? `/watch/tv/${item.id}/${item.season}/${item.episode}`
    : undefined
}
function detailHrefFor(item: WatchlistItem | FavoriteItem) { return `/${item.media_type}/${item.id}` }
function readLibrary(): LibraryState { return { continueWatching: store.getContinueWatching(), watchlist: store.getWatchlist(), favorites: store.getFavorites() } }

export function LibraryShowcase() {
  const [library, setLibrary] = useState<LibraryState>(emptyState)
  useEffect(() => { const sync = () => setLibrary(readLibrary()); sync(); return subscribeToStorageChanges('all', sync) }, [])
  return <LandingSection id="personal-library" eyebrow="Your library" title="Your night, remembered." description="The titles you save and return to stay in your local VEYRA library."><div className="grid gap-4 lg:grid-cols-3">
    <LibraryPanel title="Continue Watching"><ul className="space-y-3">{library.continueWatching.slice(0, 2).map((item) => <li key={`${item.media_type}-${item.id}`}>{hrefFor(item) ? <Link href={hrefFor(item)!} className="flex min-h-20 gap-3 rounded-lg p-2 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8f7d4]"><LibraryItem item={item} /></Link> : <div className="flex min-h-20 gap-3 rounded-lg p-2"><LibraryItem item={item} /><span className="sr-only">Saved resume position is unavailable.</span></div>}</li>)}</ul>{!library.continueWatching.length ? <Empty copy="Start a title and your saved place will appear here." /> : null}</LibraryPanel>
    <LibraryPanel title="Watchlist"><PosterShelf items={library.watchlist} /><Empty when={Boolean(library.watchlist.length)} copy="Keep a short list for the stories you want to return to." /></LibraryPanel><LibraryPanel title="Favorites"><PosterShelf items={library.favorites} /><Empty when={Boolean(library.favorites.length)} copy="Mark the titles you want close at hand." /></LibraryPanel>
  </div><div className="mt-6 flex flex-wrap justify-center gap-4"><Link href="/browse" className="inline-flex min-h-11 items-center rounded-full bg-[#b8f7d4] px-5 text-sm font-bold text-[#050507] hover:bg-[#d2ffe7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8f7d4]">Explore the catalog</Link><Link href="/my-list" className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white hover:border-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8f7d4]">Open My List</Link></div></LandingSection>
}
function LibraryPanel({ title, children }: { title: string; children: ReactNode }) { return <section className="min-h-[240px] rounded-2xl border border-white/10 bg-[#0b111a] p-5"><h3 className="font-display text-xl font-bold text-white">{title}</h3><div className="mt-4">{children}</div></section> }
function LibraryItem({ item }: { item: ContinueWatchingItem }) { return <><Image src={poster(item.poster_path, 'w185')} alt="" width={40} height={60} sizes="40px" className="h-[60px] w-10 rounded object-cover" /><span className="min-w-0 py-1"><span className="block truncate text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-xs text-white/55">{item.media_type === 'tv' && item.season !== undefined ? `Season ${item.season}${item.episode !== undefined ? ` · Episode ${item.episode}` : ''}` : 'Ready to resume'}</span>{item.episodeTitle ? <span className="mt-1 block truncate text-[11px] text-[#b8f7d4]">{item.episodeTitle}</span> : null}</span></> }
function PosterShelf({ items }: { items: Array<WatchlistItem | FavoriteItem> }) { return items.length ? <ul className="grid grid-cols-4 gap-2">{items.slice(0, 4).map((item) => <li key={`${item.media_type}-${item.id}`}><Link href={detailHrefFor(item)} aria-label={`Open ${item.title || item.name || 'saved title'}`} className="relative block aspect-[2/3] overflow-hidden rounded-md bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8f7d4]"><Image src={poster(item.poster_path, 'w185')} alt="" fill sizes="72px" className="object-cover" /></Link></li>)}</ul> : null }
function Empty({ copy, when = false }: { copy: string; when?: boolean }) { return when ? null : <p className="flex min-h-24 items-center text-sm leading-6 text-white/60">{copy}</p> }
