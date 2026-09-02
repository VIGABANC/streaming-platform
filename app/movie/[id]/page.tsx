import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Calendar, Star, Film, ChevronRight } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaRail } from '@/components/media/MediaRail'
import { MediaDetailActions } from '@/components/media/MediaDetailActions'
import {
  getMovieDetail,
  poster,
  backdrop,
  profileImage,
  titleOf,
  yearOf,
  formatRuntime,
  getCertification,
  getTrailer,
  type MovieDetail,
  type Media,
  type MediaType,
} from '@/lib/tmdb'
import { formatRating } from '@/lib/utils'

interface MoviePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const movie = await getMovieDetail(id)
    const title = titleOf(movie)
    const year = yearOf(movie)
    return {
      title: `${title} (${year}) — VEYRA`,
      description: movie.overview || `Watch ${title} on VEYRA.`,
      openGraph: {
        title: `${title} (${year}) — VEYRA`,
        description: movie.overview || `Watch ${title} on VEYRA.`,
        images: movie.backdrop_path ? [backdrop(movie.backdrop_path, 'w1280')] : [],
      },
    }
  } catch {
    return {
      title: 'Movie Details — VEYRA',
      description: 'Stream movies and series on VEYRA.',
    }
  }
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params
  let movie: MovieDetail | null = null

  try {
    movie = await getMovieDetail(id)
  } catch {
    // Check if error is 404
  }

  if (!movie) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <Film size={48} className="text-muted-foreground mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-white font-display">Movie Unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            We couldn&apos;t find this movie in the catalog or the TMDB service is unreachable.
          </p>
          <Link
            href="/movies"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            Browse Movies
          </Link>
        </div>
      </Shell>
    )
  }

  const title = titleOf(movie)
  const year = yearOf(movie)
  const cert = getCertification(movie)
  const trailer = getTrailer(movie.videos)
  const director = movie.credits?.crew?.find((c) => c.job === 'Director')
  const cast = (movie.credits?.cast ?? []).slice(0, 12)
  const recommendations: (Media & { media_type: MediaType })[] = (
    movie.recommendations?.results ?? movie.similar?.results ?? []
  ).map((m) => ({
    ...m,
    media_type: 'movie' as const,
  }))

  const backdropSrc = backdrop(movie.backdrop_path, 'original')
  const posterSrc = poster(movie.poster_path, 'w780')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: title,
    image: posterSrc,
    description: movie.overview,
    datePublished: movie.release_date,
    aggregateRating: movie.vote_average
      ? {
          '@type': 'AggregateRating',
          ratingValue: movie.vote_average,
          bestRating: '10',
          ratingCount: movie.vote_count,
        }
      : undefined,
    director: director ? { '@type': 'Person', name: director.name } : undefined,
    genre: movie.genres?.map((g) => g.name),
  }

  return (
    <Shell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero Backdrop Section */}
      <section className="relative overflow-hidden pb-12 pt-6 lg:pb-16" aria-label={`${title} overview`}>
        {/* Backdrop Image */}
        {movie.backdrop_path && (
          <div className="absolute inset-0 z-0">
            <Image
              src={backdropSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-25 filter blur-[1px]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0C18] via-[#0B0C18]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0B0C18] via-[#0B0C18]/70 to-transparent" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-8 lg:px-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight size={12} />
            <Link href="/movies" className="hover:text-white">Movies</Link>
            <ChevronRight size={12} />
            <span className="text-white truncate max-w-[200px]">{title}</span>
          </nav>

          <div className="flex flex-col gap-8 md:flex-row md:items-start lg:gap-12">
            {/* Poster Card */}
            <div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-white/10 md:w-64 lg:w-72">
              <Image
                src={posterSrc}
                alt={`${title} poster`}
                fill
                sizes="(max-width: 768px) 192px, 288px"
                className="object-cover"
                priority
              />
            </div>

            {/* Info Column */}
            <div className="flex-1 min-w-0">
              {/* Eyebrow & Badges */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 font-semibold text-primary">
                  Film
                </span>
                {cert && (
                  <span className="rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                    {cert}
                  </span>
                )}
                {movie.status && movie.status !== 'Released' && (
                  <span className="rounded-md bg-accent/10 border border-accent/30 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    {movie.status}
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white font-display md:text-5xl lg:text-6xl text-balance">
                {title}
              </h1>

              {movie.original_title && movie.original_title !== title && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Original title: <span className="text-white/80">{movie.original_title}</span>
                </p>
              )}

              {movie.tagline && (
                <p className="mt-2 text-sm italic text-primary/80 font-serif">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              {/* Metadata row */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/80">
                {year && (
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-muted-foreground" />
                    <span>{year}</span>
                  </div>
                )}
                {movie.runtime ? (
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-muted-foreground" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                ) : null}
                {movie.vote_average ? (
                  <div className="flex items-center gap-1.5 text-accent font-semibold">
                    <Star size={14} fill="currentColor" />
                    <span>{formatRating(movie.vote_average)}</span>
                    <span className="text-muted-foreground font-normal text-[11px]">
                      ({movie.vote_count?.toLocaleString()} votes)
                    </span>
                  </div>
                ) : null}
                {director && (
                  <div className="text-muted-foreground">
                    Directed by <span className="text-white font-medium">{director.name}</span>
                  </div>
                )}
              </div>

              {/* Genre chips */}
              {movie.genres && movie.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/discover?type=movie&genre=${g.id}`}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 hover:border-primary hover:text-white transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <div className="mt-6 max-w-3xl">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Storyline
                  </h2>
                  <p className="text-sm leading-relaxed text-white/85 sm:text-base">
                    {movie.overview}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <MediaDetailActions
                item={movie}
                mediaType="movie"
                watchHref={`/watch/movie/${movie.id}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cast Section */}
      {cast.length > 0 && (
        <section className="px-5 py-8 lg:px-12" aria-label="Cast">
          <h2 className="section-title mb-5">Top Cast</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {cast.map((actor) => (
              <div key={actor.id} className="w-24 shrink-0 text-center sm:w-28">
                <div className="relative mx-auto aspect-square w-20 overflow-hidden rounded-full bg-surface shadow ring-1 ring-white/10 sm:w-24">
                  <Image
                    src={profileImage(actor.profile_path)}
                    alt={actor.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-white truncate">{actor.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{actor.character}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Official Trailer Section if available */}
      {trailer && (
        <section className="px-5 py-8 lg:px-12" aria-label="Official Trailer">
          <h2 className="section-title mb-5">Trailer</h2>
          <div className="relative aspect-video max-w-3xl overflow-hidden rounded-2xl bg-black ring-1 ring-white/10 shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?rel=0`}
              title={`${title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full"
            />
          </div>
        </section>
      )}

      {/* Production Info */}
      {movie.production_companies && movie.production_companies.length > 0 && (
        <section className="px-5 py-6 lg:px-12 border-t border-white/5 text-xs text-muted-foreground">
          <span className="font-semibold text-white/70">Production: </span>
          {movie.production_companies.map((c) => c.name).join(' • ')}
        </section>
      )}

      {/* Recommendations & Similar */}
      {recommendations.length > 0 && (
        <MediaRail title="Recommended Movies" items={recommendations} />
      )}
    </Shell>
  )
}
