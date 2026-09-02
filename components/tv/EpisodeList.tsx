import Image from 'next/image'
import Link from 'next/link'
import { Play, Clock, CalendarDays } from 'lucide-react'
import { poster, type Episode } from '@/lib/tmdb'
import { formatRuntime, formatDate } from '@/lib/utils'

interface EpisodeListProps {
  showId: string | number
  season: number
  episodes: Episode[]
  activeEpisode?: number
}

export function EpisodeList({ showId, season, episodes, activeEpisode }: EpisodeListProps) {
  if (!episodes.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No episodes available for this season.
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-2" aria-label={`Season ${season} episodes`}>
      {episodes.map((ep) => {
        const isActive = ep.episode_number === activeEpisode
        const watchHref = `/watch/tv/${showId}/${season}/${ep.episode_number}`
        const stillSrc = poster(ep.still_path, 'w300')

        return (
          <li
            key={ep.id}
            aria-current={isActive ? 'true' : undefined}
            className={`group relative flex gap-4 rounded-xl p-3 transition-colors ${
              isActive
                ? 'bg-primary/10 ring-1 ring-primary/30'
                : 'hover:bg-white/5'
            }`}
          >
            {/* Episode still */}
            <Link
              href={watchHref}
              aria-label={`Play S${season} E${ep.episode_number}: ${ep.name}`}
              className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-surface focus-visible:outline-primary"
            >
              <Image
                src={stillSrc}
                alt=""
                fill
                sizes="144px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Play size={20} fill="white" className="text-white" aria-hidden="true" />
              </div>
              {/* Episode number badge */}
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                E{ep.episode_number}
              </span>
            </Link>

            {/* Episode info */}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <Link
                href={watchHref}
                className="font-semibold text-white hover:text-primary transition-colors line-clamp-1 focus-visible:outline-primary"
              >
                {ep.episode_number}. {ep.name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {ep.runtime && (
                  <span className="flex items-center gap-1">
                    <Clock size={11} aria-hidden="true" />
                    {formatRuntime(ep.runtime)}
                  </span>
                )}
                {ep.air_date && (
                  <span className="flex items-center gap-1">
                    <CalendarDays size={11} aria-hidden="true" />
                    {formatDate(ep.air_date)}
                  </span>
                )}
              </div>
              {ep.overview && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {ep.overview}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
