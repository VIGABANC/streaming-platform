import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Star, Tv, ChevronRight, Layers } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaRail } from '@/components/media/MediaRail'
import { MediaDetailActions } from '@/components/media/MediaDetailActions'
import { TVSeasonExplorer } from '@/components/tv/TVSeasonExplorer'
import { GenreTag } from '@/components/ui/GenreTag'
import {
  getTVDetail,
  getSeason,
  poster,
  backdrop,
  profileImage,
  titleOf,
  yearOf,
  getTVRating,
  getTrailer,
  type TVDetail,
  type SeasonDetail,
  type Episode,
  type Media,
  type MediaType,
} from '@/lib/tmdb'
import { formatRating } from '@/lib/utils'
import { serializeJsonLd } from '@/lib/seo/json-ld'

interface TVPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TVPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const show = await getTVDetail(id)
    const title = titleOf(show)
    const year = yearOf(show)
    return {
      title: `${title} (${year}) — VEYRA`,
      description: show.overview || `Watch ${title} on VEYRA.`,
      alternates: { canonical: `/tv/${id}` },
      openGraph: {
        title: `${title} (${year}) — VEYRA`,
        description: show.overview || `Watch ${title} on VEYRA.`,
        images: show.backdrop_path ? [backdrop(show.backdrop_path, 'w1280')] : [],
      },
    }
  } catch {
    return {
      title: 'TV Series — VEYRA',
      description: 'Stream movies and series on VEYRA.',
    }
  }
}

export default async function TVDetailPage({ params }: TVPageProps) {
  const { id } = await params
  let show: TVDetail | null = null

  try {
    show = await getTVDetail(id)
  } catch {
    // 404 handled below
  }

  if (!show) {
    return (
      <Shell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
          <Tv size={48} className="text-muted-foreground mb-4 opacity-50" />
          <h1 className="text-2xl font-bold text-white font-display">Series Unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            We couldn&apos;t find this series in the catalog or the TMDB service is unreachable.
          </p>
          <Link
            href="/tv"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            Browse TV Shows
          </Link>
        </div>
      </Shell>
    )
  }

  const title = titleOf(show)
  const year = yearOf(show)
  const rating = getTVRating(show)
  const trailer = getTrailer(show.videos)
  const cast = (show.credits?.cast ?? []).slice(0, 12)
  const recommendations: (Media & { media_type: MediaType })[] = (
    show.recommendations?.results ?? show.similar?.results ?? []
  ).map((m) => ({
    ...m,
    media_type: 'tv' as const,
  }))

  const seasons = show.seasons ?? []
  // Find first non-specials season or season 1
  const initialSeason = seasons.find((s) => s.season_number > 0) || seasons[0]
  const initialSeasonNum = initialSeason ? initialSeason.season_number : 1

  let initialEpisodes: Episode[] = []
  try {
    const seasonData: SeasonDetail = await getSeason(id, initialSeasonNum)
    initialEpisodes = seasonData.episodes ?? []
  } catch {
    initialEpisodes = []
  }

  const backdropSrc = backdrop(show.backdrop_path, 'original')
  const posterSrc = poster(show.poster_path, 'w780')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    image: posterSrc,
    description: show.overview,
    startDate: show.first_air_date,
    numberOfSeasons: show.number_of_seasons,
    numberOfEpisodes: show.number_of_episodes,
    aggregateRating: show.vote_average
      ? {
          '@type': 'AggregateRating',
          ratingValue: show.vote_average,
          bestRating: '10',
          ratingCount: show.vote_count,
        }
      : undefined,
    genre: show.genres?.map((g) => g.name),
  }

  return (
    <Shell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {/* Hero Backdrop Section */}
      <section className="relative overflow-hidden pb-12 pt-6 lg:pb-16" aria-label={`${title} overview`}>
        {/* Backdrop Image */}
        {show.backdrop_path && (
          <div className="absolute inset-0 z-0">
            <Image
              src={backdropSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-25 filter blur-[1px]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/70 to-transparent" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-8 lg:px-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight size={12} />
            <Link href="/tv" className="hover:text-white">TV Shows</Link>
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
                  Series
                </span>
                {rating && (
                  <span className="rounded-md border border-white/20 bg-white/5 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                    {rating}
                  </span>
                )}
                {show.status && (
                  <span className="rounded-md bg-accent/10 border border-accent/30 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    {show.status}
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white font-display md:text-5xl lg:text-6xl text-balance">
                {title}
              </h1>

              {show.original_name && show.original_name !== title && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Original title: <span className="text-white/80">{show.original_name}</span>
                </p>
              )}

              {show.tagline && (
                <p className="mt-2 text-sm italic text-primary/80 font-serif">
                  &ldquo;{show.tagline}&rdquo;
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
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className="text-muted-foreground" />
                  <span>
                    {show.number_of_seasons || seasons.length} Season
                    {(show.number_of_seasons || seasons.length) === 1 ? '' : 's'}
                    {show.number_of_episodes ? ` (${show.number_of_episodes} eps)` : ''}
                  </span>
                </div>
                {show.vote_average ? (
                  <div className="flex items-center gap-1.5 text-accent font-semibold">
                    <Star size={14} fill="currentColor" />
                    <span>{formatRating(show.vote_average)}</span>
                    <span className="text-muted-foreground font-normal text-[11px]">
                      ({show.vote_count?.toLocaleString()} votes)
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Genre chips */}
              {show.genres && show.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {show.genres.map((g) => (
                    <GenreTag key={g.id} id={g.id} name={g.name} type="tv" />
                  ))}
                </div>
              )}

              {/* Overview */}
              {show.overview && (
                <div className="mt-6 max-w-3xl">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Synopsis
                  </h2>
                  <p className="text-sm leading-relaxed text-white/85 sm:text-base">
                    {show.overview}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <MediaDetailActions
                item={show}
                mediaType="tv"
                watchHref={`/watch/tv/${show.id}/${initialSeasonNum}/1`}
                trailerKey={trailer?.key}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Season and Episode Explorer */}
      <section className="px-5 py-8 lg:px-12 border-t border-white/5">
        <TVSeasonExplorer
          showId={show.id}
          seasons={seasons}
          initialSeasonNumber={initialSeasonNum}
          initialEpisodes={initialEpisodes}
        />
      </section>

      {/* Cast Section */}
      {cast.length > 0 && (
        <section className="px-5 py-8 lg:px-12" aria-label="Cast">
          <h2 className="section-title mb-5">Cast & Creators</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {cast.map((actor) => (
              <Link
                key={actor.id}
                href={`/person/${actor.id}`}
                className="w-24 shrink-0 text-center sm:w-28 group"
              >
                <div className="relative mx-auto aspect-square w-20 overflow-hidden rounded-full bg-[#0A0D14] shadow-lg ring-1 ring-white/10 transition-all duration-300 group-hover:ring-2 group-hover:ring-cyan group-hover:scale-105 sm:w-24">
                  <Image
                    src={profileImage(actor.profile_path)}
                    alt={actor.name}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <p className="mt-2 text-xs font-semibold text-white truncate group-hover:text-cyan transition-colors">
                  {actor.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{actor.character}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <MediaRail title="More Series Like This" items={recommendations} />
      )}
    </Shell>
  )
}
