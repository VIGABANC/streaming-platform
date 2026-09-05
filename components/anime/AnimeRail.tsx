import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AnimeCard } from './AnimeCard'
import type { AnimeListItem } from '@/lib/anilist'
import { useRef } from 'react'

export function AnimeRail({ title, items, href }: { title: string; items: AnimeListItem[]; href?: string }) {
  const railRef = useRef<HTMLDivElement>(null)
  if (!items.length) return null
  return (
    <section className="mt-10" aria-label={title}>
      <div className="mb-4 flex items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3"><span aria-hidden="true" className="h-px w-6 rounded-full bg-primary" /><h2 className="section-title">{title}</h2>{href && <Link href={href} className="ml-2 text-xs text-muted-foreground hover:text-primary">See all →</Link>}</div>
        <div className="hidden gap-1.5 md:flex"><button type="button" aria-label={`Scroll ${title} left`} onClick={() => railRef.current?.scrollBy({ left: -480, behavior: 'smooth' })} className="grid size-9 place-items-center rounded-full border border-white/10 text-muted-foreground hover:border-primary hover:text-primary"><ChevronLeft size={16} /></button><button type="button" aria-label={`Scroll ${title} right`} onClick={() => railRef.current?.scrollBy({ left: 480, behavior: 'smooth' })} className="grid size-9 place-items-center rounded-full border border-white/10 text-muted-foreground hover:border-primary hover:text-primary"><ChevronRight size={16} /></button></div>
      </div>
      <div ref={railRef} className="flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar lg:gap-4 lg:px-8">
        {items.map((item, index) => <AnimeCard key={`${item.sourceId}-${index}`} item={item} priority={index === 0} />)}
      </div>
    </section>
  )
}
