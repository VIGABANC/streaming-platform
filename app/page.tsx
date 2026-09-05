import { CinematicHero } from '@/components/landing/CinematicHero'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { ProviderSwitcher } from '@/components/landing/ProviderSwitcher'
import { HomeCatalog } from '@/components/landing/HomeCatalog'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { discoverByProvider, getAiringToday, getNowPlaying, getPopularMovies, getPopularTV, getProviders, getTopRatedMovies, getTopRatedTV, getTrending } from '@/lib/tmdb'

export const metadata = { title: 'VEYRA — The Night Signal', description: 'Find the story worth staying up for. Discover movies and television across every signal.' }

type SearchParams = Promise<{ provider?: string }>

export default async function LandingPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {}
  const providerId = params.provider ? Number(params.provider) : undefined
  const [providers, trending] = await Promise.all([getProviders().catch(() => []), getTrending().then((data) => data.results.filter((item) => item.media_type !== 'person').slice(0, 12)).catch(() => [])])
  const provider = providers.find((item) => item.provider_id === providerId)
  const selectedId = provider?.provider_id
  const [popularMovies, popularTV, topRatedMovies, topRatedTV, nowPlaying, airingToday] = await Promise.all(selectedId ? [discoverByProvider('movie', selectedId).catch(() => ({ results: [] })), discoverByProvider('tv', selectedId).catch(() => ({ results: [] })), discoverByProvider('movie', selectedId, 'US').then((data) => ({ results: data.results.filter((item) => (item.vote_average ?? 0) > 7) })).catch(() => ({ results: [] })), discoverByProvider('tv', selectedId, 'US').then((data) => ({ results: data.results.filter((item) => (item.vote_average ?? 0) > 7) })).catch(() => ({ results: [] })), Promise.resolve({ results: [] }), Promise.resolve({ results: [] })] : [getPopularMovies().catch(() => ({ results: [] })), getPopularTV().catch(() => ({ results: [] })), getTopRatedMovies().catch(() => ({ results: [] })), getTopRatedTV().catch(() => ({ results: [] })), getNowPlaying().catch(() => ({ results: [] })), getAiringToday().catch(() => ({ results: [] }))])

  return <div className="min-h-screen overflow-x-hidden bg-[#050507] text-white selection:bg-amber-400/30"><a href="#main-content" className="skip-link">Skip to main content</a><LandingNav /><main id="main-content"><CinematicHero trending={trending} /><ProviderSwitcher providers={providers} activeProviderId={selectedId} /><HomeCatalog providerName={provider?.provider_name} trending={trending} popularMovies={popularMovies.results} popularTV={popularTV.results} topRatedMovies={topRatedMovies.results} topRatedTV={topRatedTV.results} nowPlaying={nowPlaying.results} airingToday={airingToday.results} /><FinalCTA trending={trending} /></main><LandingFooter /></div>
}
