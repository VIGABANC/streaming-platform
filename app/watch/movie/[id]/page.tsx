import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Star } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { PlayerFrame } from '@/components/player/PlayerFrame'
import { ContinueWatchingTracker } from '@/components/player/ContinueWatchingTracker'
import { MediaDetailActions } from '@/components/media/MediaDetailActions'
import { MediaRail } from '@/components/media/MediaRail'
import {
  getMovieDetail,
  titleOf,
  yearOf,
  backdrop,
  formatRuntime,
  type MovieDetail,
  type Media,
  type MediaType,
} from '@/lib/tmdb'
import { getMovieEmbedUrl } from '@/lib/player'
import { formatRating } from '@/lib/utils'

interface WatchMoviePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: WatchMoviePageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const movie = await getMovieDetail(id)
    const title = titleOf(movie)
    return {
      title: `Watch ${title} — VEYRA`,
      description: `Stream ${title} on VEYRA.`,
    }
  } catch {
    return {
      title: 'Watch Movie — VEYRA',
    }
  }
}

export default async function WatchMoviePage({ params }: WatchMoviePageProps) {
  const { id } = await params
  let movie: MovieDetail | null = null

  try {
    movie = await getMovieDetail(id)
  } catch {
    // Graceful fallback
  }

  const title = movie ? titleOf(movie) : 'Movie'
  const year = movie ? yearOf(movie) : ''
  const embedUrl = getMovieEmbedUrl(id)
  const backdropUrl = movie?.backdrop_path ? backdrop(movie.backdrop_path, 'w1280') : undefined

  const similarTitles: (Media & { media_type: MediaType })[] = (
    movie?.recommendations?.results ?? movie?.similar?.results ?? []
  ).map((m) => ({
    ...m,
    media_type: 'movie' as const,
  }))

  return (
    <Shell>
      {movie && (
        <ContinueWatchingTracker
          item={{
            id: movie.id,
            media_type: 'movie',
            title,
            poster_path: movie.poster_path,
            backdrop_path: movie.backdrop_path,
            lastOpenedAt: Date.now(),
          }}
        />
      )}

      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/movie/${id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to movie details</span>
          </Link>
          <span className="text-xs text-white/50">Streaming via configured provider</span>
        </div>

        {/* Video Player Frame */}
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl bg-black">
          <PlayerFrame
            mediaType="movie"
            mediaId={id}
            src={embedUrl}
            title={`${title} playback`}
            artwork={backdropUrl}
            backHref={`/movie/${id}`}
          />
        </div>

        {/* Media Info Section */}
        {movie && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-surface/50 p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="rounded bg-primary/20 px-2 py-0.5 font-bold uppercase tracking-wider text-primary text-[10px]">
                    Movie
                  </span>
                  {year && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {year}
                    </span>
                  )}
                  {movie.runtime ? (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatRuntime(movie.runtime)}
                    </span>
                  ) : null}
                  {movie.vote_average ? (
                    <span className="flex items-center gap-1 text-accent font-semibold">
                      <Star size={12} fill="currentColor" />
                      {formatRating(movie.vote_average)}
                    </span>
                  ) : null}
                </div>

                <h1 className="text-2xl font-bold text-white font-display md:text-3xl">
                  {title}
                </h1>

                {movie.overview && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {movie.overview}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                <MediaDetailActions
                  item={movie}
                  mediaType="movie"
                  watchHref={`/watch/movie/${movie.id}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Similar Titles */}
        {similarTitles.length > 0 && (
          <div className="mt-8">
            <MediaRail title="Related Titles" items={similarTitles} />
          </div>
        )}
      </div>
    </Shell>
  )
}
