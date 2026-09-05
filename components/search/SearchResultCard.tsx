'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { MediaSearchResult } from '@/lib/search/types'

export function SearchResultCard({ item }: { item: MediaSearchResult }) {
  const href = `/${item.ref.kind}/${item.ref.sourceId}`
  return (
    <article className="group relative min-w-0">
      <Link href={href} aria-label={`${item.title} — view details`} className="block overflow-hidden rounded-xl bg-[#0A0D14] shadow-lg ring-1 ring-white/8 outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image src={item.posterUrl || '/poster-fallback.svg'} alt={`${item.title} poster`} fill sizes="(max-width: 640px) 145px, (max-width: 1024px) 170px, 190px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2 pt-10"><span className="text-[9px] font-bold uppercase tracking-wider text-white/80">{item.ref.kind === 'anime' ? 'Anime' : item.ref.kind === 'tv' ? 'TV' : 'Film'}</span></div>
        </div>
        <div className="p-2.5 pt-2"><p className="truncate text-xs font-semibold leading-snug text-white">{item.title}</p><div className="mt-1 flex items-center gap-2 text-[11px] text-white/55"><span>{item.year || '—'}</span>{item.rating ? <span className="text-amber-400">{item.rating.toFixed(1)}</span> : null}</div></div>
      </Link>
    </article>
  )
}
