import { MediaRailSection } from '@/components/landing/MediaRailSection'
import { DeferredHomeSections } from '@/components/landing/DeferredHomeSections'
import type { LandingData } from '@/components/landing/landing-types'

interface HomeCatalogProps {
  data: LandingData
  providerName?: string
}

export function HomeCatalog({ data, providerName }: HomeCatalogProps) {
  const { lists } = data
  return <>
    <div className="mx-auto max-w-[1440px] px-5 pt-10 sm:px-6 lg:px-12"><div className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" /><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400">{providerName ? `Exploring ${providerName}` : 'The signal is live'}</p></div></div>
    <MediaRailSection id="trending-tonight" title="Trending Tonight" subtitle="Signals everyone is following right now." items={lists.trending} href="/discover" />
    <MediaRailSection id="popular-movies" title={providerName ? `Popular on ${providerName}` : 'Popular Movies'} subtitle="A faster route to the stories drawing a crowd." items={lists.popularMovies} href="/movies" />
    <DeferredHomeSections data={data} />
  </>
}
