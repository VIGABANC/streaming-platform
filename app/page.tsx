import { headers } from 'next/headers'
import { CinematicHero } from '@/components/landing/CinematicHero'
import { LandingNav } from '@/components/landing/LandingNav'
import { LandingFooter } from '@/components/landing/LandingFooter'
import { HomeCatalog } from '@/components/landing/HomeCatalog'
import { ProviderSwitcher } from '@/components/landing/ProviderSwitcher'
import { firstMovieWithBackdrop, firstWithBackdrop, type LandingData } from '@/components/landing/landing-types'
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

const unavailableLandingData: LandingData = {
  lists: {
    trending: [],
    popularMovies: [],
    popularTV: [],
    topRatedMovies: [],
    topRatedTV: [],
    nowPlaying: [],
    airingToday: [],
  },
}

const seasonFixtureLandingData: LandingData = {
  lists: unavailableLandingData.lists,
  detail: {
    detail: {
      id: 100,
      name: 'Fixture Signal',
      media_type: 'tv',
      genres: [],
      production_companies: [],
      seasons: [
        { id: 101, name: 'Season 1', season_number: 1, episode_count: 1 },
        { id: 102, name: 'Season 2', season_number: 2, episode_count: 1 },
      ],
    },
    season: {
      id: 101,
      name: 'Season 1',
      season_number: 1,
      episodes: [{ id: 111, name: 'First signal', episode_number: 1, season_number: 1 }],
    },
  },
}

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
    safe(() => getNowPlaying(), emptyList),
    safe(() => getAiringToday(), emptyList),
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
  const movieCandidate = firstMovieWithBackdrop([...landingLists.trending, ...landingLists.popularMovies, ...landingLists.nowPlaying])
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

export default async function LandingPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {}
  const landingFixture = (await headers()).get('x-veyra-e2e-landing-data')
  const useUnavailableFixture = landingFixture === 'unavailable'
  const requestedProviderId = params.provider ? Number(params.provider) : undefined
  const providers = useUnavailableFixture ? [] : await safe(() => getProviders(), [])
  const provider = providers.find((item) => item.provider_id === requestedProviderId)
  const landingData = useUnavailableFixture ? unavailableLandingData : landingFixture === 'seasons' ? seasonFixtureLandingData : await loadLandingData(provider?.provider_id)
  const heroItem = landingData.detail?.detail.backdrop_path ? landingData.detail.detail : firstWithBackdrop(landingData.lists.trending) ?? firstWithBackdrop(landingData.lists.popularMovies)

  return <div className="min-h-screen overflow-x-hidden bg-[#050507] text-white selection:bg-amber-400/30">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <LandingNav />
    <main id="main-content">
      <CinematicHero item={heroItem} />
      <ProviderSwitcher providers={providers} activeProviderId={provider?.provider_id} />
      <HomeCatalog data={landingData} providerName={provider?.provider_name} />
    </main>
    <LandingFooter />
    <MobileNav variant="landing" />
  </div>
}
