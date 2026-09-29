// ─────────────────────────────────────────────────────────────────────────────
// Dev fixture route — exercises native-source player features (ambient glow,
// precision scrubber thumbnails, next-episode countdown, audio track switching)
// using a CC0 sample video. Gated to non-production environments only.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { PlayerFrame, type ProviderHealthInfo } from '@/components/player/PlayerFrame'
import type { PlaybackSource } from '@/lib/player'

export const dynamic = 'force-dynamic'

const DEV_FIXTURE_VIDEO = 'https://test-videos.co.uk/big-buck-bunny/mp4-720p-30bf-2m.mp4'

export function generateMetadata(): Metadata {
  return { title: 'Dev Fixture Player — VEYRA' }
}

export default function DevFixturePage() {
  if (process.env.NODE_ENV === 'production') notFound()

  const fixtureSource: PlaybackSource = {
    id: 'dev-fixture:movie:0',
    providerId: 'dev-fixture',
    providerName: 'Dev Fixture',
    mode: 'native-media',
    mediaType: 'movie',
    url: DEV_FIXTURE_VIDEO,
    origin: 'https://test-videos.co.uk',
    format: 'mp4',
    availability: 'available',
    verification: 'native-events',
    authorizationStatus: 'authorized',
    qualityCapability: 'native',
    subtitleCapability: 'none',
    audioTrackCapability: 'none',
    documentedReadiness: 'documented-api',
  }

  const fixtureHealth: ProviderHealthInfo[] = [
    {
      id: 'dev-fixture',
      name: 'Dev Fixture',
      origin: 'https://test-videos.co.uk',
      dnsResolved: true,
      reachable: true,
      status: 'healthy',
      latencyMs: 0,
      lastCheckedAt: new Date().toISOString(),
      error: null,
    },
  ]

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-primary">DEV FIXTURE</span>
          <span className="text-xs text-white/50">CC0 sample — Big Buck Bunny</span>
        </div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl bg-[#050505]">
          <PlayerFrame
            mediaType="movie"
            mediaId="0"
            title="Dev Fixture — Big Buck Bunny (CC0)"
            artwork={undefined}
            backHref="/"
            nativeSources={[fixtureSource]}
            providerHealth={fixtureHealth}
            preferredProviderId="dev-fixture"
          />
        </div>
        <p className="mt-3 text-xs text-white/40">
          This route is only available in development. It uses a CC0 sample video to exercise
          native-source player features: ambient glow, precision scrubber thumbnails, and
          next-episode countdown.
        </p>
      </div>
    </Shell>
  )
}
