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
  getPopularTV,
  getTopRatedTV,
  getAiringToday,
  getOnTheAir,
  getTrendingTV,
  genres,
  type Media,
} from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'TV Shows — VEYRA',
  description: 'Explore trending series, critically acclaimed shows, and television hits on VEYRA. Less hunting, more watching.',
  openGraph: {
    title: 'TV Shows — VEYRA',
    description: 'Explore trending series, critically acclaimed shows, and television hits on VEYRA.',
  },
}

type TVFeed = (Media & { media_type: 'tv' })[]

async function loadTVList(
  loader: () => Promise<{ results: Media[] }>,
): Promise<CatalogResult<TVFeed>> {
  return loadCatalog(async () => {
    const data = await loader()
    return (data.results ?? []).map((item) => ({
      ...item,
      media_type: 'tv' as const,
    }))
  })
}

async function TVHeroSection() {
  const [trending, popular] = await Promise.all([
    loadTVList(getTrendingTV),
    loadTVList(getPopularTV),
  ])
  const heroItem = trending.data?.[0] ?? popular.data?.[0]
  if (heroItem) return <Hero item={heroItem} />
  if (trending.status === 'failure' && popular.status === 'failure') {
    return <CatalogFailureState error={trending.error ?? popular.error} />
  }
  if (trending.status === 'empty' && popular.status === 'empty') return <CatalogEmptyState />

  return null
}

async function TVRailsSection() {
  const [popular, topRated, airingToday, onTheAir, trending] = await Promise.all([
    loadTVList(getPopularTV),
    loadTVList(getTopRatedTV),
    loadTVList(getAiringToday),
    loadTVList(getOnTheAir),
    loadTVList(getTrendingTV),
  ])

  const items = (result: CatalogResult<TVFeed>) => result.status === 'success' ? result.data ?? [] : []

  return (
    <>
      {trending.status === 'failure' ? <CatalogFailureState error={trending.error} /> : <MediaRail title="Trending series" items={items(trending).slice(1)} />}
      {popular.status === 'failure' ? <CatalogFailureState error={popular.error} /> : <MediaRail title="Popular TV series" items={items(popular)} />}
      {topRated.status === 'failure' ? <CatalogFailureState error={topRated.error} /> : <MediaRail title="Top rated of all time" items={items(topRated)} />}
      {airingToday.status === 'failure' ? <CatalogFailureState error={airingToday.error} /> : <MediaRail title="Airing today" items={items(airingToday)} />}
      {onTheAir.status === 'failure' ? <CatalogFailureState error={onTheAir.error} /> : <MediaRail title="Currently on the air" items={items(onTheAir)} landscape />}
    </>
  )
}

export default function TVPage() {
  return (
    <Shell>
      {/* Featured TV Hero */}
      <Suspense fallback={<SkeletonHero />}>
        <TVHeroSection />
      </Suspense>

      {/* Genre Filter Quick Bar */}
      <section className="px-5 pt-8 lg:px-8" aria-label="Browse Series by Genre">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">The Series Desk</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white font-display md:text-4xl">
              TV Shows
            </h1>
          </div>
          <Link
            href="/discover?type=tv"
            className="text-xs font-semibold text-primary hover:underline underline-offset-4"
          >
            Advanced filters →
          </Link>
        </div>

        {/* Quick Genre Chips */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <Link
            href="/discover?type=tv"
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            All Series
          </Link>
          {genres.tv.map((g) => (
            <Link
              key={g.id}
              href={`/discover?type=tv&genre=${g.id}`}
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
        <TVRailsSection />
      </Suspense>
    </Shell>
  )
}
