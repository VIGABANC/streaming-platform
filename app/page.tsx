import { Suspense } from 'react'
import { CinematicHero } from '@/components/landing/CinematicHero'
import { LandingNav } from '@/components/landing/LandingNav'
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
import { getTrending } from '@/lib/tmdb'

export default async function LandingPage() {
  const trendingData = await getTrending().catch(() => ({ results: [] }));
  const trending = trendingData.results.slice(0, 10);

  return (
    <div className="bg-[#050507] text-white min-h-screen selection:bg-cyan-500/30 overflow-x-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <LandingNav />
      <main id="main-content">
        <Suspense fallback={<div className="h-screen w-full bg-[#050507]" />}>
          <CinematicHero trending={trending} />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 w-full" />}>
          <MediaRailSection trending={trending} />
        </Suspense>

        <DiscoveryShowcase />
        <SearchShowcase />
        <DetailShowcase />
        <EpisodeShowcase />
        <LibraryShowcase />
        <PlayerShowcase />
        <DeviceShowcase />
        <FinalCTA trending={trending} />
      </main>
      <LandingFooter />
    </div>
  )
}
