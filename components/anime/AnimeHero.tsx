import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { AnimeListItem } from '@/lib/anilist'

export function AnimeHero({ item }: { item: AnimeListItem }) {
  return (
    <section className="relative overflow-hidden pb-12 pt-6 lg:pb-16" aria-label={`${item.title} anime feature`}>
      {item.bannerUrl && <Image src={item.bannerUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/70 to-transparent" />
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-16 lg:px-12 lg:pt-24">
        <p className="eyebrow text-primary">The Anime Signal</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-white font-display md:text-6xl lg:text-7xl text-balance">{item.title}</h1>
        {item.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base line-clamp-3">{item.description}</p>}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/70">
          {item.year && <span>{item.year}</span>}
          {item.format && <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">{item.format}</span>}
          {item.score && <span className="text-amber-400">{item.score.toFixed(1)} / 10</span>}
        </div>
        <Link href={`/anime/${item.sourceId}`} className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          View anime signal <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
