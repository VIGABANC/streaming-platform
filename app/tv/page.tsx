import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Hero } from '@/components/media/Hero'
import { MediaRail } from '@/components/media/MediaRail'
import { SkeletonRail, SkeletonHero } from '@/components/feedback/Skeletons'
import {
  getPopularTV,
  getTopRatedTV,
  getAiringToday,
  getOnTheAir,
  getTrendingTV,
  genres,
  type Media,
  type MediaType,
} from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'TV Shows — VEYRA',
  description: 'Explore trending series, critically acclaimed shows, and television hits on VEYRA. Less hunting, more watching.',
  openGraph: {
    title: 'TV Shows — VEYRA',
    description: 'Explore trending series, critically acclaimed shows, and television hits on VEYRA.',
  },
}

async function safeTVList(
  loader: () => Promise<{ results: Media[] }>,
): Promise<(Media & { media_type: MediaType })[]> {
  try {
    const data = await loader()
    return (data.results ?? []).map((item) => ({
      ...item,
      media_type: 'tv' as const,
    }))
  } catch {
    return []
  }
}

async function TVHeroSection() {
  const [trending, popular] = await Promise.all([
    safeTVList(getTrendingTV),
    safeTVList(getPopularTV),
  ])
  const heroItem = trending[0] || popular[0]
  if (!heroItem) return null

  return <Hero item={heroItem} />
}

async function TVRailsSection() {
  const [popular, topRated, airingToday, onTheAir, trending] = await Promise.all([
    safeTVList(getPopularTV),
    safeTVList(getTopRatedTV),
    safeTVList(getAiringToday),
    safeTVList(getOnTheAir),
    safeTVList(getTrendingTV),
  ])

  return (
    <>
      {trending.length > 1 && (
        <MediaRail title="Trending series" items={trending.slice(1)} />
      )}
      {popular.length > 0 && (
        <MediaRail title="Popular TV series" items={popular} />
      )}
      {topRated.length > 0 && (
        <MediaRail title="Top rated of all time" items={topRated} />
      )}
      {airingToday.length > 0 && (
        <MediaRail title="Airing today" items={airingToday} />
      )}
      {onTheAir.length > 0 && (
        <MediaRail title="Currently on the air" items={onTheAir} landscape />
      )}
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
