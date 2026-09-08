import { DiscoveryShowcase } from '@/components/landing/DiscoveryShowcase'
import { DetailShowcase } from '@/components/landing/DetailShowcase'
import { MediaRailSection } from '@/components/landing/MediaRailSection'
import { SearchShowcase } from '@/components/landing/SearchShowcase'
import { EpisodeShowcase } from '@/components/landing/EpisodeShowcase'
import { LibraryShowcase } from '@/components/landing/LibraryShowcase'
import { PlayerShowcase } from '@/components/landing/PlayerShowcase'
import { DeviceShowcase } from '@/components/landing/DeviceShowcase'
import { FinalCTA } from '@/components/landing/FinalCTA'
import type { LandingData } from '@/components/landing/landing-types'

interface HomeCatalogProps {
  data: LandingData
  providerName?: string
}

export function HomeCatalog({ data, providerName }: HomeCatalogProps) {
  const { lists } = data
  const categories = [
    { label: 'Popular', href: '/discover', items: [...lists.popularMovies, ...lists.popularTV] },
    { label: 'Top Rated', href: '/movies', items: [...lists.topRatedMovies, ...lists.topRatedTV] },
    { label: 'Now Playing', href: '/new', items: lists.nowPlaying },
    { label: 'Airing Today', href: '/tv', items: lists.airingToday },
  ]

  return <>
    <div className="mx-auto max-w-[1440px] px-5 pt-10 sm:px-6 lg:px-12"><div className="flex items-center gap-3"><span className="size-1.5 rounded-full bg-amber-400" aria-hidden="true" /><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400">{providerName ? `Exploring ${providerName}` : 'The signal is live'}</p></div></div>
    <MediaRailSection id="trending-tonight" title="Trending Tonight" subtitle="Signals everyone is following right now." items={lists.trending} href="/discover" />
    <MediaRailSection id="popular-movies" title={providerName ? `Popular on ${providerName}` : 'Popular Movies'} subtitle="A faster route to the stories drawing a crowd." items={lists.popularMovies} href="/movies" />
    <MediaRailSection id="popular-tv" title="Popular TV Shows" subtitle="Return to a world with another episode waiting." items={lists.popularTV} href="/tv" />
    <MediaRailSection id="critically-acclaimed" title="Critically Acclaimed" items={[...lists.topRatedMovies, ...lists.topRatedTV]} href="/discover" />
    <MediaRailSection id="now-playing" title="Now Playing" items={lists.nowPlaying} href="/new" />
    <MediaRailSection id="airing-today" title="Airing Today" items={lists.airingToday} href="/tv" />
    <DiscoveryShowcase categories={categories} />
    <SearchShowcase initialItems={[...lists.trending, ...lists.popularMovies, ...lists.popularTV]} />
    <DetailShowcase detail={data.detail?.detail} providers={data.detail?.providers} />
    <EpisodeShowcase detail={data.detail?.detail.media_type === 'tv' ? data.detail.detail : undefined} season={data.detail?.detail.media_type === 'tv' ? data.detail.season : undefined} />
    <LibraryShowcase />
    <PlayerShowcase item={lists.trending[0]} />
    <DeviceShowcase />
    <FinalCTA item={lists.trending[1] ?? lists.trending[0]} />
  </>
}
