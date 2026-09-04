import { Suspense } from 'react'
import { Shell } from '@/components/layout/Shell'
import { HeroCarousel } from '@/components/media/HeroCarousel'
import { MediaRail } from '@/components/media/MediaRail'
import { SkeletonRail, SkeletonHero } from '@/components/feedback/Skeletons'
import { ContinueWatchingRail } from '@/components/media/ContinueWatchingRail'
import { ProviderRail } from '@/components/providers/ProviderRail'
import { getTrending, getPopularMovies, getPopularTV, getTopRatedMovies, getTopRatedTV, getNowPlaying, getUpcoming, getProviders, type Media, type MediaType } from '@/lib/tmdb'

async function safeList(loader: () => Promise<{ results: Media[] }>, mediaType: MediaType): Promise<(Media & { media_type: MediaType })[]> {
  try {
    const data = await loader()
    return data.results.map((item) => ({ ...item, media_type: (item.media_type as MediaType) ?? mediaType }))
  } catch { return [] }
}

async function HomeFeed() {
  const trending = await safeList(getTrending, 'movie')
  const [providers, popular, popularTv, topRated, topRatedTv, nowPlaying, upcoming] = await Promise.all([
    getProviders().catch(() => []), safeList(getPopularMovies, 'movie'), safeList(getPopularTV, 'tv'), safeList(getTopRatedMovies, 'movie'), safeList(getTopRatedTV, 'tv'), safeList(getNowPlaying, 'movie'), safeList(getUpcoming, 'movie'),
  ])
  return <>
    <HeroCarousel items={trending.slice(0, 5)} />
    <ContinueWatchingRail />
    <ProviderRail providers={providers} />
    <MediaRail title="Trending today" items={trending.slice(5)} />
    <MediaRail title="New & fresh" items={nowPlaying} href="/new" />
    <MediaRail title="Popular movies" items={popular} href="/movies" />
    <MediaRail title="Popular TV shows" items={popularTv} href="/tv" />
    <MediaRail title="Top rated" items={[...topRated, ...topRatedTv]} />
    <MediaRail title="Coming soon" items={upcoming} landscape />
  </>
}

export const metadata = { title: 'VEYRA — Discover what to watch', description: 'Find movies and series worth staying up for.' }

export default function HomePage() {
  return <Shell><Suspense fallback={<><SkeletonHero /><SkeletonRail /><SkeletonRail /></>}><HomeFeed /></Suspense></Shell>
}
