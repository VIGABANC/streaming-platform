import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Hero } from '@/components/media/Hero'
import { MediaRail } from '@/components/media/MediaRail'
import { SkeletonRail, SkeletonHero } from '@/components/feedback/Skeletons'
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getUpcoming,
  getTrendingMovies,
  genres,
  type Media,
  type MediaType,
} from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'Movies — VEYRA',
  description: 'Explore trending, top rated, and new release movies on VEYRA. Less hunting, more watching.',
  openGraph: {
    title: 'Movies — VEYRA',
    description: 'Explore trending, top rated, and new release movies on VEYRA.',
  },
}

async function safeMovieList(
  loader: () => Promise<{ results: Media[] }>,
): Promise<(Media & { media_type: MediaType })[]> {
  try {
    const data = await loader()
    return (data.results ?? []).map((item) => ({
      ...item,
      media_type: 'movie' as const,
    }))
  } catch {
    return []
  }
}

async function MoviesHeroSection() {
  const [trending, popular] = await Promise.all([
    safeMovieList(getTrendingMovies),
    safeMovieList(getPopularMovies),
  ])
  const heroItem = trending[0] || popular[0]
  if (!heroItem) return null

  return <Hero item={heroItem} />
}

async function MovieRailsSection() {
  const [popular, topRated, nowPlaying, upcoming, trending] = await Promise.all([
    safeMovieList(getPopularMovies),
    safeMovieList(getTopRatedMovies),
    safeMovieList(getNowPlaying),
    safeMovieList(getUpcoming),
    safeMovieList(getTrendingMovies),
  ])

  return (
    <>
      {trending.length > 1 && (
        <MediaRail title="Trending this week" items={trending.slice(1)} />
      )}
      {popular.length > 0 && (
        <MediaRail title="Popular movies" items={popular} />
      )}
      {topRated.length > 0 && (
        <MediaRail title="Top rated of all time" items={topRated} />
      )}
      {nowPlaying.length > 0 && (
        <MediaRail title="In theaters & streaming now" items={nowPlaying} />
      )}
      {upcoming.length > 0 && (
        <MediaRail title="Coming soon" items={upcoming} landscape />
      )}
    </>
  )
}

export default function MoviesPage() {
  return (
    <Shell>
      {/* Featured Movie Hero */}
      <Suspense fallback={<SkeletonHero />}>
        <MoviesHeroSection />
      </Suspense>

      {/* Genre Filter Quick Bar */}
      <section className="px-5 pt-8 lg:px-8" aria-label="Browse by Genre">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">The Feature Reel</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white font-display md:text-4xl">
              Movies
            </h1>
          </div>
          <Link
            href="/discover?type=movie"
            className="text-xs font-semibold text-primary hover:underline underline-offset-4"
          >
            Advanced filters →
          </Link>
        </div>

        {/* Quick Genre Chips */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Link
            href="/discover?type=movie"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            All Movies
          </Link>
          {genres.movie.map((g) => (
            <Link
              key={g.id}
              href={`/discover?type=movie&genre=${g.id}`}
              className="shrink-0 rounded-full border border-white/10 bg-surface px-4 py-2 text-xs font-medium text-white/80 transition-all hover:border-primary/50 hover:bg-white/5 hover:text-white"
            >
              {g.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Content Rails */}
      <Suspense
        fallback={
          <>
            <SkeletonRail />
            <SkeletonRail />
            <SkeletonRail />
          </>
        }
      >
        <MovieRailsSection />
      </Suspense>
    </Shell>
  )
}
