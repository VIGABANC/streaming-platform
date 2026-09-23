'use client'

import Link from 'next/link'
import { useState } from 'react'

interface AnimeEpisode {
  number: number
  title: string | null
  aired: string | null
  image?: string | null
}

interface AnimeEpisodeListProps {
  animeId: string
  episodes: AnimeEpisode[]
  coverImageUrl: string | null
  playbackUnavailable: boolean
}

function EpisodeThumbnail({ episode, coverImageUrl }: { episode: AnimeEpisode; coverImageUrl: string | null }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = !imageFailed ? episode.image || coverImageUrl : null
  const title = episode.title || `Episode ${episode.number}`

  return (
    <span className="aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white/5 sm:w-36">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={`Episode ${episode.number}: ${title}`}
          width={144}
          height={81}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="grid size-full place-items-center text-xs font-bold text-primary">E{episode.number}</span>
      )}
    </span>
  )
}

export function AnimeEpisodeList({ animeId, episodes, coverImageUrl, playbackUnavailable }: AnimeEpisodeListProps) {
  return (
    <section id="episodes" aria-labelledby="episodes-title" className="mt-8 rounded-xl border border-white/10 bg-surface/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="episodes-title" className="font-semibold text-white">Episode list</h2>
        <span className="text-xs text-white/45">Metadata only</span>
      </div>
      <ul className="mt-4 divide-y divide-white/5">
        {episodes.map((episode) => (
          <li key={episode.number}>
            <Link href={`/watch/anime/${animeId}/${episode.number}`} className="flex min-h-16 items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-white/5">
              <EpisodeThumbnail episode={episode} coverImageUrl={coverImageUrl} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-white/85">{episode.title || `Episode ${episode.number}`}</span>
                {playbackUnavailable && <span className="mt-1 block text-xs text-white/40">Playback unavailable</span>}
              </span>
              {episode.aired && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{episode.aired.slice(0, 10)}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export type { AnimeEpisode }

export function getAnimeEpisodeThumbnailState(episodeNumber: number, imageUrl: string | null, failed: boolean) {
  return failed || !imageUrl ? { src: null, placeholder: `E${episodeNumber}` } : { src: imageUrl, placeholder: null }
}
