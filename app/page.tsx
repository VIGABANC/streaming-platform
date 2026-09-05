import { Suspense } from 'react'
import { Shell } from '@/components/layout/Shell'
import { HeroCarousel } from '@/components/media/HeroCarousel'
import { MediaRail } from '@/components/media/MediaRail'
import { SkeletonRail, SkeletonHero } from '@/components/feedback/Skeletons'
import { ContinueWatchingRail } from '@/components/media/ContinueWatchingRail'
import { ProviderRail } from '@/components/providers/ProviderRail'
import { CatalogEmptyState, CatalogFailureState } from '@/components/feedback/CatalogState'
import { loadCatalog, type CatalogResult } from '@/lib/catalog'
import { getTrending, getPopularMovies, getPopularTV, getTopRatedMovies, getTopRatedTV, getNowPlaying, getUpcoming, getProviders, type Media, type MediaType } from '@/lib/tmdb'

type Feed = (Media & { media_type: MediaType })[]

async function loadMediaList(loader: () => Promise<{ results: Media[] }>, mediaType: MediaType): Promise<CatalogResult<Feed>> {
  return loadCatalog(async () => {
    const data = await loader()
    return data.results.map((item) => ({ ...item, media_type: (item.media_type as MediaType) ?? mediaType }))
  })
}

async function HomeFeed() {
  const [trending, providers, popular, popularTv, topRated, topRatedTv, nowPlaying, upcoming] = await Promise.all([
    loadMediaList(getTrending, 'movie'),
    loadCatalog(getProviders),
    loadMediaList(getPopularMovies, 'movie'),
    loadMediaList(getPopularTV, 'tv'),
    loadMediaList(getTopRatedMovies, 'movie'),
    loadMediaList(getTopRatedTV, 'tv'),
    loadMediaList(getNowPlaying, 'movie'),
    loadMediaList(getUpcoming, 'movie'),
  ])

  const feeds = [trending, providers, popular, popularTv, topRated, topRatedTv, nowPlaying, upcoming]
  const failed = feeds.filter((feed) => feed.status === 'failure')
  const available = feeds.some((feed) => feed.status !== 'failure')
  if (!available) {
    return <CatalogFailureState error={failed[0]?.error} />
  }

  const media = (result: CatalogResult<Feed>) => result.status === 'success' ? result.data ?? [] : []
  const providerItems = providers.status === 'success' ? providers.data ?? [] : []
  return <>
    {trending.status === 'failure' ? <CatalogFailureState error={trending.error} /> : <HeroCarousel items={media(trending).slice(0, 5)} />}
    <ContinueWatchingRail />
    {providers.status === 'failure' ? <CatalogFailureState error={providers.error} /> : <ProviderRail providers={providerItems} />}
    {trending.status === 'success' && <MediaRail title="Trending today" items={media(trending).slice(5)} />}
    {nowPlaying.status === 'failure' ? <CatalogFailureState error={nowPlaying.error} /> : <MediaRail title="New & fresh" items={media(nowPlaying)} href="/new" />}
    {popular.status === 'failure' ? <CatalogFailureState error={popular.error} /> : <MediaRail title="Popular movies" items={media(popular)} href="/movies" />}
    {popularTv.status === 'failure' ? <CatalogFailureState error={popularTv.error} /> : <MediaRail title="Popular TV shows" items={media(popularTv)} href="/tv" />}
    {(topRated.status === 'failure' || topRatedTv.status === 'failure') ? <CatalogFailureState error={topRated.error ?? topRatedTv.error} /> : <MediaRail title="Top rated" items={[...media(topRated), ...media(topRatedTv)]} />}
    {upcoming.status === 'failure' ? <CatalogFailureState error={upcoming.error} /> : <MediaRail title="Coming soon" items={media(upcoming)} landscape />}
    {feeds.every((feed) => feed.status === 'empty') && <CatalogEmptyState />}
  </>
}

export const metadata = { title: 'VEYRA — Discover what to watch', description: 'Find movies and series worth staying up for.' }

export default function HomePage() {
  return <Shell><Suspense fallback={<><SkeletonHero /><SkeletonRail /><SkeletonRail /></>}><HomeFeed /></Suspense></Shell>
}
