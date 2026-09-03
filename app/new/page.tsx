import type { Metadata } from 'next'
import { Shell } from '@/components/layout/Shell'
import { Hero } from '@/components/media/Hero'
import { MediaRail } from '@/components/media/MediaRail'
import { MediaGrid } from '@/components/media/MediaGrid'
import {
  getNowPlaying,
  getOnTheAir,
  getUpcoming,
  type Media,
  type MediaType,
} from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'New Releases & Coming Soon — VEYRA',
  description: 'Stream brand new movie releases and latest television series episodes on VEYRA.',
}

export default async function NewReleasesPage() {
  const [nowPlayingRes, onTheAirRes, upcomingRes] = await Promise.all([
    getNowPlaying().catch(() => ({ results: [] })),
    getOnTheAir().catch(() => ({ results: [] })),
    getUpcoming().catch(() => ({ results: [] })),
  ])

  const nowPlaying: (Media & { media_type: MediaType })[] = nowPlayingRes.results.map((m) => ({
    ...m,
    media_type: 'movie' as const,
  }))

  const onTheAir: (Media & { media_type: MediaType })[] = onTheAirRes.results.map((m) => ({
    ...m,
    media_type: 'tv' as const,
  }))

  const upcoming: (Media & { media_type: MediaType })[] = upcomingRes.results.map((m) => ({
    ...m,
    media_type: 'movie' as const,
  }))

  const spotlight = nowPlaying[0] || onTheAir[0]

  return (
    <Shell>
      {/* Featured Spotlight Hero */}
      {spotlight && <Hero item={spotlight} />}

      <div className="mx-auto max-w-[1440px] px-5 pt-8 lg:px-12 space-y-10">
        {/* Title row */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#E50914]" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
              New & Trending Releases
            </h1>
          </div>
          <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-bold text-primary">
            Fresh Catalog
          </span>
        </div>

        {/* Now Playing Rail */}
        {nowPlaying.length > 1 && (
          <MediaRail
            title="Now Streaming (Fresh Releases)"
            items={nowPlaying.slice(1)}
          />
        )}

        {/* New TV Episodes Rail */}
        {onTheAir.length > 0 && (
          <MediaRail
            title="New Episodes Airing This Week"
            items={onTheAir}
          />
        )}

        {/* Coming Soon Landscape Rail */}
        {upcoming.length > 0 && (
          <MediaRail
            title="Coming Soon to VEYRA"
            items={upcoming}
            landscape
          />
        )}

        {/* Full Fresh Releases Grid */}
        <section aria-label="Explore All Fresh Releases" className="pb-12">
          <h2 className="section-title mb-6">Explore All Fresh Drops</h2>
          <MediaGrid items={[...nowPlaying.slice(0, 12), ...onTheAir.slice(0, 12)]} />
        </section>
      </div>
    </Shell>
  )
}
