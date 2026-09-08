import { Suspense } from 'react'
import { LandingNav } from '@/components/landing/LandingNav'
import { CinematicHero } from '@/components/landing/CinematicHero'
import { MediaRailSection } from '@/components/landing/MediaRailSection'
import { DiscoveryShowcase } from '@/components/landing/DiscoveryShowcase'
import { SearchShowcase } from '@/components/landing/SearchShowcase'
import { DetailShowcase } from '@/components/landing/DetailShowcase'
import { EpisodeShowcase } from '@/components/landing/EpisodeShowcase'
import { LibraryShowcase } from '@/components/landing/LibraryShowcase'
import { PlayerShowcase } from '@/components/landing/PlayerShowcase'
import { DeviceShowcase } from '@/components/landing/DeviceShowcase'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { getTrending, getPopularMovies, getPopularTV, type Media } from '@/lib/tmdb'

export const metadata = {
  title: 'VEYRA — The Night Signal',
  description: 'Find the story worth staying up for. Cinematic movie and TV discovery — trending, acclaimed, and new releases in one elegant experience.',
}

async function LandingContent() {
  let trending: Media[] = []
  let popularMovies: Media[] = []
  let popularTV: Media[] = []

  try {
    const [trendingRes, popMoviesRes, popTVRes] = await Promise.all([
      getTrending(),
      getPopularMovies(),
      getPopularTV(),
    ])
    trending = trendingRes.results || []
    popularMovies = popMoviesRes.results || []
    popularTV = popTVRes.results || []
  } catch (err) {
    console.error('Failed to load TMDB data for landing page:', err)
  }

  const featuredDetailItem = trending[1] || trending[0]

  return (
    <main id="main-content" className="bg-[#050507] text-white min-h-screen">
      <LandingNav />
      <CinematicHero trending={trending} />
      <MediaRailSection trending={trending} />
      <DiscoveryShowcase movies={popularMovies} tv={popularTV} />
      <SearchShowcase trending={trending} />
      <DetailShowcase item={featuredDetailItem} />
      <EpisodeShowcase />
      <LibraryShowcase items={trending} />
      <PlayerShowcase />
      <DeviceShowcase />
      <FinalCTA />
      <LandingFooter />
    </main>
  )
}

export default function LandingPage() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Suspense fallback={<div className="min-h-screen bg-[#050507]" />}>
        <LandingContent />
      </Suspense>
    </>
  )
}
