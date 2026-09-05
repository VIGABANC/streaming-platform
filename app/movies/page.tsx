import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Hero } from '@/components/media/Hero'
import { MediaRail } from '@/components/media/MediaRail'
import { SkeletonRail, SkeletonHero } from '@/components/feedback/Skeletons'
import { CatalogFailureState, CatalogEmptyState } from '@/components/feedback/CatalogState'
import { loadCatalog, type CatalogResult } from '@/lib/catalog'
import {
  getPopularMovies,
  getTopRatedMovies,
  getNowPlaying,
  getUpcoming,
  getTrendingMovies,
  genres,
  type Media,
} from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'Movies — VEYRA',
  description: 'Explore trending, top rated, and new release movies on VEYRA. Less hunting, more watching.',
  openGraph: {
    title: 'Movies — VEYRA',
    description: 'Explore trending, top rated, and new release movies on VEYRA.',
  },
}

type MovieFeed = (Media & { media_type: 'movie' })[]

async function loadMovieList(
  loader: () => Promise<{ results: Media[] }>,
): Promise<CatalogResult<MovieFeed>> {
  return loadCatalog(async () => {
    const data = await loader()
    return (data.results ?? []).map((item) => ({
      ...item,
      media_type: 'movie' as const,
    }))
  })
}

async function MoviesHeroSection() {
  const [trending, popular] = await Promise.all([
    loadMovieList(getTrendingMovies),
    loadMovieList(getPopularMovies),
  ])
  const heroItem = (trending.data?.[0] ?? popular.data?.[0])
  if (heroItem) return <Hero item={heroItem} />
  if (trending.status === 'failure' && popular.status === 'failure') {
    return <CatalogFailureState error={trending.error ?? popular.error} />
  }
  if (trending.status === 'empty' && popular.status === 'empty') return <CatalogEmptyState />

  return null
}

async function MovieRailsSection() {
  const [popular, topRated, nowPlaying, upcoming, trending] = await Promise.all([
    loadMovieList(getPopularMovies),
    loadMovieList(getTopRatedMovies),
    loadMovieList(getNowPlaying),
    loadMovieList(getUpcoming),
    loadMovieList(getTrendingMovies),
  ])

  const items = (result: CatalogResult<MovieFeed>) => result.status === 'success' ? result.data ?? [] : []

  return (
    <>
      {trending.status === 'failure' ? <CatalogFailureState error={trending.error} /> : <MediaRail title="Trending this week" items={items(trending).slice(1)} />}
      {popular.status === 'failure' ? <CatalogFailureState error={popular.error} /> : <MediaRail title="Popular movies" items={items(popular)} />}
      {topRated.status === 'failure' ? <CatalogFailureState error={topRated.error} /> : <MediaRail title="Top rated of all time" items={items(topRated)} />}
      {nowPlaying.status === 'failure' ? <CatalogFailureState error={nowPlaying.error} /> : <MediaRail title="In theaters & streaming now" items={items(nowPlaying)} />}
      {upcoming.status === 'failure' ? <CatalogFailureState error={upcoming.error} /> : <MediaRail title="Coming soon" items={items(upcoming)} landscape />}
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
