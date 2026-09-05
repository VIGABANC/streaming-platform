import { MediaCard } from './MediaCard'
import type { Media, MediaType } from '@/lib/tmdb'

interface MediaGridProps {
  items: (Media & { media_type: MediaType })[]
  className?: string
}

export function MediaGrid({ items, className }: MediaGridProps) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 lg:gap-4 ${className ?? ''}`}
    >
      {items.map((item, i) => (
        <MediaCard
          key={`${item.id}-${item.media_type}-${i}`}
          item={item}
          priority={i < 2}
        />
      ))}
    </div>
  )
}
