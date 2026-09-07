import { CinematicHero } from '@/components/landing/CinematicHero'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { LandingMotion } from '@/components/landing/LandingMotion'
import { LandingSection } from '@/components/landing/LandingSection'
import { MediaPosterCard } from '@/components/landing/MediaPosterCard'
import { ProviderSwitcher } from '@/components/landing/ProviderSwitcher'
import { firstWithBackdrop, type LandingData } from '@/components/landing/landing-types'
import { MobileNav } from '@/components/layout/MobileNav'
import {
  discoverByProvider, getAiringToday, getMovieDetail, getNowPlaying, getPopularMovies,
  getPopularTV, getProviders, getSeason, getTopRatedMovies, getTopRatedTV, getTrending,
  getTVDetail, type Media, type MediaType,
} from '@/lib/tmdb'

export const metadata = {
  title: 'VEYRA — The Night Signal',
  description: 'Find the story worth staying up for. Discover movies and television across every signal.',
}

type SearchParams = Promise<{ provider?: string }>
type MediaList = { results: Media[] }

async function safe<T>(loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader()
  } catch {
    return fallback
  }
}

function withMediaType(items: Media[], mediaType: MediaType): Media[] {
  return items.map((item) => ({ ...item, media_type: item.media_type === 'person' ? 'person' : mediaType }))
}

async function loadLandingData(providerId?: number): Promise<LandingData> {
  const emptyList: MediaList = { results: [] }
  const lists = await Promise.all([
    safe(() => getTrending(), emptyList),
    safe(() => providerId ? discoverByProvider('movie', providerId) : getPopularMovies(), emptyList),
    safe(() => providerId ? discoverByProvider('tv', providerId) : getPopularTV(), emptyList),
    safe(() => providerId ? discoverByProvider('movie', providerId, 'US').then((data) => ({ results: data.results.filter((item) => (item.vote_average ?? 0) > 7) })) : getTopRatedMovies(), emptyList),
    safe(() => providerId ? discoverByProvider('tv', providerId, 'US').then((data) => ({ results: data.results.filter((item) => (item.vote_average ?? 0) > 7) })) : getTopRatedTV(), emptyList),
    safe(() => providerId ? Promise.resolve(emptyList) : getNowPlaying(), emptyList),
    safe(() => providerId ? Promise.resolve(emptyList) : getAiringToday(), emptyList),
  ])
  const [trending, popularMovies, popularTV, topRatedMovies, topRatedTV, nowPlaying, airingToday] = lists
  const landingLists = {
    trending: trending.results.filter((item) => item.media_type !== 'person'),
    popularMovies: withMediaType(popularMovies.results, 'movie'),
    popularTV: withMediaType(popularTV.results, 'tv'),
    topRatedMovies: withMediaType(topRatedMovies.results, 'movie'),
    topRatedTV: withMediaType(topRatedTV.results, 'tv'),
    nowPlaying: withMediaType(nowPlaying.results, 'movie'),
    airingToday: withMediaType(airingToday.results, 'tv'),
  }
  const tvCandidate = [...landingLists.popularTV, ...landingLists.airingToday].find((item) => item.id)
  const movieCandidate = firstWithBackdrop([...landingLists.trending, ...landingLists.popularMovies, ...landingLists.nowPlaying])
  const [tvEnrichment, movieDetail] = await Promise.all([
    tvCandidate ? safe(async () => {
      const detail = await getTVDetail(tvCandidate.id)
      const seasonNumber = detail.seasons?.find((season) => season.season_number > 0)?.season_number
      const season = seasonNumber === undefined ? undefined : await safe(() => getSeason(detail.id, seasonNumber), undefined)
      return { detail, season }
    }, undefined) : Promise.resolve(undefined),
    movieCandidate ? safe(() => getMovieDetail(movieCandidate.id), undefined) : Promise.resolve(undefined),
  ])
  return { lists: landingLists, detail: tvEnrichment ? tvEnrichment : movieDetail ? { detail: movieDetail } : undefined }
}

function LandingRail({ items }: { items: Media[] }) {
  if (items.length === 0) return <p className="text-sm text-white/55">The signal is quiet for now. Check back shortly.</p>
  return <LandingMotion className="landing-rail -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12">
    {items.slice(0, 12).map((item) => <div key={`${item.media_type ?? 'movie'}-${item.id}`} data-landing-reveal><MediaPosterCard item={item} /></div>)}
  </LandingMotion>
}

export default async function LandingPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {}
  const requestedProviderId = params.provider ? Number(params.provider) : undefined
  const providers = await safe(() => getProviders(), [])
  const provider = providers.find((item) => item.provider_id === requestedProviderId)
  const landingData = await loadLandingData(provider?.provider_id)
  const heroItem = landingData.detail?.detail.backdrop_path ? landingData.detail.detail : firstWithBackdrop(landingData.lists.trending) ?? firstWithBackdrop(landingData.lists.popularMovies)

  return <div className="min-h-screen overflow-x-hidden bg-[#050507] text-white selection:bg-amber-400/30">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <LandingNav />
    <main id="main-content">
      <CinematicHero item={heroItem} />
      <ProviderSwitcher providers={providers} activeProviderId={provider?.provider_id} />
      <LandingSection id="trending-tonight" eyebrow="Live transmission" title="Trending Tonight" description="Signals everyone is following right now."><LandingRail items={landingData.lists.trending} /></LandingSection>
      <LandingSection id="popular-movies" eyebrow={provider ? `On ${provider.provider_name}` : 'Feature reel'} title={provider ? `Popular on ${provider.provider_name}` : 'Popular Movies'} description="A faster route to the stories drawing a crowd."><LandingRail items={landingData.lists.popularMovies} /></LandingSection>
      <LandingSection id="popular-tv" eyebrow="Series desk" title="Popular TV Shows" description="Return to a world with another episode waiting."><LandingRail items={landingData.lists.popularTV} /></LandingSection>
    </main>
    <LandingFooter />
    <MobileNav variant="landing" />
  </div>
}
