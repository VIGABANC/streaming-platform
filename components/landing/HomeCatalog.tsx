import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { poster, titleOf, yearOf } from '@/lib/tmdb'
import type { Media } from '@/lib/tmdb'

function Rail({ title, subtitle, items }: { title: string; subtitle?: string; items: Media[] }) {
  if (!items.length) return null
  return <section className="py-8" aria-labelledby={`${title.toLowerCase().replaceAll(' ', '-')}-heading`}>
    <div className="mb-5 flex items-end justify-between gap-4"><div><h2 id={`${title.toLowerCase().replaceAll(' ', '-')}-heading`} className="text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h2>{subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}</div><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{items.length} signals</span></div>
    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide" role="list" aria-label={title}>
      {items.slice(0, 12).map((item) => { const type = item.media_type === 'tv' ? 'tv' : 'movie'; return <Link key={`${type}-${item.id}`} href={`/${type}/${item.id}`} role="listitem" className="group w-[142px] shrink-0 snap-start focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 md:w-[180px]"><div className="relative aspect-[2/3] overflow-hidden rounded-sm bg-white/[.06]"><Image src={poster(item.poster_path, 'w500')} alt={`${titleOf(item)} poster`} fill sizes="(max-width: 768px) 142px, 180px" className="object-cover transition duration-500 group-hover:scale-105" /> <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-12 opacity-0 transition-opacity duration-200 group-hover:opacity-100"><div className="flex items-center gap-1 text-xs text-amber-400"><Star className="size-3 fill-current" />{item.vote_average?.toFixed(1)}</div></div></div><h3 className="mt-3 truncate text-sm font-medium text-white/85 transition-colors group-hover:text-amber-400">{titleOf(item)}</h3><p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/35">{yearOf(item)} · {type}</p></Link> })}
    </div>
  </section>
}

export function HomeCatalog({ providerName, trending, popularMovies, popularTV, topRatedMovies, topRatedTV, nowPlaying, airingToday }: { providerName?: string; trending: Media[]; popularMovies: Media[]; popularTV: Media[]; topRatedMovies: Media[]; topRatedTV: Media[]; nowPlaying: Media[]; airingToday: Media[] }) {
  return <div className="mx-auto max-w-[1440px] px-6 pb-24 lg:px-12"><div className="mb-3 flex items-center gap-3"><span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" /><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400">{providerName ? `Exploring ${providerName}` : 'The signal is live'}</p></div>{providerName ? <><Rail title={`Popular on ${providerName}`} items={trending} /><Rail title={`${providerName} movies`} items={popularMovies} /><Rail title={`${providerName} TV shows`} items={popularTV} /><Rail title={`Top rated on ${providerName}`} items={topRatedMovies} /></> : <><Rail title="Trending Tonight" subtitle="Signals everyone is following right now." items={trending} /><Rail title="Popular Movies" items={popularMovies} /><Rail title="Popular TV Shows" items={popularTV} /><Rail title="Critically Acclaimed" items={[...topRatedMovies, ...topRatedTV]} /><Rail title="Now Playing" items={nowPlaying} /><Rail title="Airing Today" items={airingToday} /></>}</div>
}
