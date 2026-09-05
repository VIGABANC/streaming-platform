import Image from 'next/image'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { poster, titleOf, yearOf, type Media } from '@/lib/tmdb'
import { mediaHref, mediaTypeOf } from './landing-types'

interface MediaPosterCardProps {
  item: Media
  priority?: boolean
  size?: 'rail' | 'feature'
}

export function MediaPosterCard({ item, priority = false, size = 'rail' }: MediaPosterCardProps) {
  const title = titleOf(item)
  const mediaType = mediaTypeOf(item)
  const isFeature = size === 'feature'

  return (
    <article className={isFeature ? 'w-[220px] sm:w-[260px]' : 'w-[148px] sm:w-[172px]'}>
      <Link
        href={mediaHref(item)}
        aria-label={`${title} — view details`}
        className="landing-poster group block overflow-hidden rounded-xl bg-[var(--card)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--cyan)]"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={poster(item.poster_path, isFeature ? 'w500' : 'w342')}
            alt={`${title} poster`}
            fill
            priority={priority}
            sizes={isFeature ? '(max-width: 640px) 220px, 260px' : '(max-width: 640px) 148px, 172px'}
            className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.04] motion-reduce:group-hover:scale-100"
          />
        </div>
        <div className="p-2.5">
          <p className="truncate text-xs font-semibold text-white">{title}</p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-white/55">
            <span>{yearOf(item) || '—'}</span>
            <span className="uppercase tracking-[0.14em]">{mediaType === 'tv' ? 'TV' : 'Film'}</span>
            {item.vote_average ? (
              <span className="ml-auto flex items-center gap-0.5 font-semibold text-amber-300">
                <Star size={10} fill="currentColor" aria-hidden="true" />
                {item.vote_average.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  )
}
