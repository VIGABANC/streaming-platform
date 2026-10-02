'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import type { LandingData } from './landing-types'

const DiscoveryShowcase = dynamic(() => import('./DiscoveryShowcase').then((module) => module.DiscoveryShowcase), { ssr: false })
const MediaRailSection = dynamic(() => import('./MediaRailSection').then((module) => module.MediaRailSection), { ssr: false })
const SearchShowcase = dynamic(() => import('./SearchShowcase').then((module) => module.SearchShowcase), { ssr: false })
const DetailShowcase = dynamic(() => import('./DetailShowcase').then((module) => module.DetailShowcase), { ssr: false })
const EpisodeShowcase = dynamic(() => import('./EpisodeShowcase').then((module) => module.EpisodeShowcase), { ssr: false })
const LibraryShowcase = dynamic(() => import('./LibraryShowcase').then((module) => module.LibraryShowcase), { ssr: false })
const PlayerShowcase = dynamic(() => import('./PlayerShowcase').then((module) => module.PlayerShowcase), { ssr: false })
const DeviceShowcase = dynamic(() => import('./DeviceShowcase').then((module) => module.DeviceShowcase), { ssr: false })
const FinalCTA = dynamic(() => import('./FinalCTA').then((module) => module.FinalCTA), { ssr: false })

export function DeferredHomeSections({ data }: { data: LandingData }) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const { lists } = data
  const categories = [
    { label: 'Popular', href: '/discover', items: [...lists.popularMovies, ...lists.popularTV] },
    { label: 'Top Rated', href: '/movies', items: [...lists.topRatedMovies, ...lists.topRatedTV] },
    { label: 'Now Playing', href: '/new', items: lists.nowPlaying },
    { label: 'Airing Today', href: '/tv', items: lists.airingToday },
  ]
  useEffect(() => {
    const node = sentinel.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setReady(true); observer.disconnect() }
    }, { rootMargin: '900px' })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  if (!ready) return <div ref={sentinel} className="min-h-[8rem]" aria-label="More VEYRA sections loading" />
  return <div ref={sentinel}>
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
  </div>
}
