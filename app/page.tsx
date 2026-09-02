import { Suspense } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Hero } from '@/components/media/Hero'
import { MediaRail } from '@/components/media/MediaRail'
import { SkeletonRail, SkeletonHero } from '@/components/feedback/Skeletons'
import { ContinueWatchingRail } from '@/components/media/ContinueWatchingRail'
import {
  getTrending,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
  getNowPlaying,
  getUpcoming,
  type Media,
  type MediaType,
} from '@/lib/tmdb'

async function safeList(
  loader: () => Promise<{ results: Media[] }>,
  mediaType: MediaType,
): Promise<(Media & { media_type: MediaType })[]> {
  try {
    const data = await loader()
    return data.results.map((item) => ({
      ...item,
      media_type: (item.media_type as MediaType) ?? mediaType,
    }))
  } catch {
    return []
  }
}

// Async section components for independent Suspense boundaries
async function TrendingSection() {
  const trending = await safeList(getTrending, 'movie')
  if (!trending.length) return null

  const hero = trending[0]

  return (
    <>
      <Hero item={hero} />
      <MediaRail title="Trending today" items={trending.slice(1)} />
    </>
  )
}

async function MovieSections() {
  const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
    safeList(getPopularMovies, 'movie'),
    safeList(getTopRatedMovies, 'movie'),
    safeList(getNowPlaying, 'movie'),
    safeList(getUpcoming, 'movie'),
  ])

  return (
    <>
      {popular.length > 0 && <MediaRail title="Popular movies" items={popular} href="/movies" />}
      {topRated.length > 0 && <MediaRail title="Top rated movies" items={topRated} />}
      {nowPlaying.length > 0 && <MediaRail title="Now playing" items={nowPlaying} />}
      {upcoming.length > 0 && <MediaRail title="Coming soon" items={upcoming} landscape />}
    </>
  )
}

async function TVSections() {
  const [popular, topRated] = await Promise.all([
    safeList(getPopularTV, 'tv'),
    safeList(getTopRatedTV, 'tv'),
  ])

  return (
    <>
      {popular.length > 0 && <MediaRail title="Popular TV shows" items={popular} href="/tv" />}
      {topRated.length > 0 && <MediaRail title="Top rated TV" items={topRated} />}
    </>
  )
}

// No-TMDB fallback
function CatalogOffline() {
  return (
    <div className="mx-5 mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 lg:mx-8">
      <h2 className="font-bold text-white font-display">Catalog not connected</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Add your{' '}
        <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">TMDB_API_KEY</code>{' '}
        to <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">.env.local</code>{' '}
        to load the live catalog. See{' '}
        <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">.env.example</code>{' '}
        for setup instructions.
      </p>
    </div>
  )
}

export default function HomePage() {
  return (
    <Shell>
      {/* Hero — independent boundary so other sections don't block */}
      <Suspense fallback={<SkeletonHero />}>
        <TrendingSection />
      </Suspense>

      {/* Continue Watching — client component, hydrates from localStorage */}
      <ContinueWatchingRail />

      {/* Movie rails */}
      <Suspense
        fallback={
          <>
            <SkeletonRail />
            <SkeletonRail />
          </>
        }
      >
        <MovieSections />
      </Suspense>

      {/* TV rails */}
      <Suspense
        fallback={
          <>
            <SkeletonRail />
            <SkeletonRail />
          </>
        }
      >
        <TVSections />
      </Suspense>
    </Shell>
  )
}
