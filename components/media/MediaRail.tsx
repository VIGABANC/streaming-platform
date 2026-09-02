'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MediaCard } from './MediaCard'
import type { Media, MediaType } from '@/lib/tmdb'

interface MediaRailProps {
  title: string
  items: (Media & { media_type: MediaType })[]
  href?: string
  landscape?: boolean
}

export function MediaRail({ title, items, href, landscape = false }: MediaRailProps) {
  const railRef = useRef<HTMLDivElement>(null)

  if (!items.length) return null

  const scroll = (dir: 'left' | 'right') => {
    railRef.current?.scrollBy({
      left: dir === 'right' ? 480 : -480,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mt-10" aria-label={title}>
      <div className="mb-4 flex items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 bg-primary rounded-full" />
          <h2 className="section-title">{title}</h2>
          {href && (
            <Link
              href={href}
              className="ml-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              See all →
            </Link>
          )}
        </div>

        {/* Scroll controls — desktop only */}
        <div className="hidden gap-1.5 md:flex">
          <button
            type="button"
            aria-label={`Scroll ${title} left`}
            onClick={() => scroll('left')}
            className="grid size-9 place-items-center rounded-full border border-white/10 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label={`Scroll ${title} right`}
            onClick={() => scroll('right')}
            className="grid size-9 place-items-center rounded-full border border-white/10 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto px-5 pb-4 no-scrollbar lg:gap-4 lg:px-8"
      >
        {items.map((item, i) => (
          <MediaCard
            key={`${item.id}-${item.media_type}-${i}`}
            item={item}
            landscape={landscape}
            priority={i === 0}
          />
        ))}
      </div>
    </section>
  )
}
