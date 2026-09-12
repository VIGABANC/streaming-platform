import { cache } from 'react'
import {
  canonicalMediaId,
  normalizeTitles,
  releaseDate,
  type AnimeDetail,
  type CatalogMediaItem,
  type EpisodeSummary,
  type SeasonSummary,
} from './catalog-model'
import { getAnimeEpisodes } from './jikan'
import { fetchWithTimeout, ProviderTimeoutError } from './provider-http'

const ANILIST_API = process.env.ANILIST_API_URL || 'https://graphql.anilist.co'

export type AniListErrorCode =
  | 'ANILIST_NETWORK_ERROR'
  | 'ANILIST_RATE_LIMITED'
  | 'ANILIST_INVALID_RESPONSE'
  | 'ANILIST_NOT_FOUND'
  | 'ANILIST_REQUEST_FAILED'

export class AniListError extends Error {
  constructor(public readonly code: AniListErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'AniListError'
  }
}

interface AniListMedia {
  id: number
  title?: { romaji?: string | null; english?: string | null; native?: string | null; userPreferred?: string | null }
  synonyms?: string[] | null
  description?: string | null
  coverImage?: { large?: string | null; extraLarge?: string | null } | null
  bannerImage?: string | null
  averageScore?: number | null
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null
  format?: string | null
  status?: string | null
  episodes?: number | null
  duration?: number | null
  genres?: string[] | null
  studios?: { nodes?: Array<{ name: string; isAnimationStudio?: boolean }> } | null
  nextAiringEpisode?: { episode: number; airingAt: number } | null
  season?: string | null
  seasonYear?: number | null
  relations?: { edges?: Array<{ relationType?: string; node?: AniListMedia | null }> } | null
  recommendations?: { nodes?: Array<{ media?: AniListMedia | null }> } | null
}

interface AniListResponse {
  data?: {
    Page?: { media?: AniListMedia[] | null }
    Media?: AniListMedia | null
  }
  errors?: Array<{ message?: string }>
}

function stripDescription(value?: string | null): string {
  return (value ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function preferredTitle(media: AniListMedia): string {
  return media.title?.userPreferred || media.title?.english || media.title?.romaji || media.title?.native || 'Untitled Anime'
}

function mapBaseAnime(media: AniListMedia): CatalogMediaItem {
  const title = preferredTitle(media)
  const originalTitle = media.title?.native || media.title?.romaji || undefined
  const titles = normalizeTitles({
    preferred: title,
    original: originalTitle,
    alternatives: [media.title?.english ?? '', media.title?.romaji ?? '', ...(media.synonyms ?? [])],
  })

  const item = {
    id: media.id,
    source: 'anilist' as const,
    sourceId: String(media.id),
    canonicalId: `anilist:anime:${media.id}`,
    media_type: 'anime' as const,
    title,
    name: title,
    originalTitle,
    alternativeTitles: titles.filter((candidate) => ![title, originalTitle].filter(Boolean).some((known) => candidate.toLocaleLowerCase() === known!.toLocaleLowerCase())),
    overview: stripDescription(media.description),
    poster_path: null,
    backdrop_path: null,
    posterUrl: media.coverImage?.extraLarge || media.coverImage?.large || null,
    backdropUrl: media.bannerImage || null,
    vote_average: media.averageScore ? media.averageScore / 10 : 0,
    release_date: releaseDate(media.startDate?.year, media.startDate?.month, media.startDate?.day),
    original_language: 'ja',
    genres: media.genres ?? [],
    status: media.status ?? undefined,
    format: media.format ?? undefined,
    episodes: media.episodes,
    duration: media.duration,
    studios: (media.studios?.nodes ?? []).filter((studio) => studio.isAnimationStudio !== false).map((studio) => studio.name),
    attribution: 'AniList',
  } satisfies CatalogMediaItem

  return item
}

export function mapAniListAnime(media: AniListMedia): AnimeDetail {
  const item = mapBaseAnime(media)
  const relations = (media.relations?.edges ?? [])
    .filter((edge) => edge.node)
    .map((edge) => mapBaseAnime(edge.node as AniListMedia))
  const recommendations = (media.recommendations?.nodes ?? [])
    .filter((node) => node.media)
    .map((node) => mapBaseAnime(node.media as AniListMedia))

  const season: SeasonSummary[] = media.season && media.seasonYear
    ? [{ id: `${media.season}-${media.seasonYear}`, number: 1, title: `${media.season} ${media.seasonYear}`, episodeCount: media.episodes ?? undefined, airDate: String(media.seasonYear) }]
    : []
  const episodesList: EpisodeSummary[] = []

  return {
    ...item,
    media_type: 'anime',
    seasons: season,
    episodesList,
    episodesStatus: 'empty',
    relations,
    recommendations,
    nextAiringEpisode: media.nextAiringEpisode ? { number: media.nextAiringEpisode.episode, airingAt: media.nextAiringEpisode.airingAt } : null,
  }
}

const SEARCH_QUERY = `
query SearchAnime($page: Int, $perPage: Int, $search: String, $genre: String, $status: MediaStatus, $format: MediaFormat, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    media(type: ANIME, search: $search, genre: $genre, status: $status, format: $format, sort: $sort, isAdult: false) {
      id title { romaji english native userPreferred } synonyms description(asHtml: false)
      coverImage { large extraLarge } bannerImage averageScore
      startDate { year month day } format status episodes duration genres
      studios { nodes { name isAnimationStudio } }
      season seasonYear nextAiringEpisode { episode airingAt }
    }
  }
}`

const DETAIL_QUERY = `
query AnimeDetail($id: Int) {
  Media(id: $id, type: ANIME) {
    id title { romaji english native userPreferred } synonyms description(asHtml: false)
    coverImage { large extraLarge } bannerImage averageScore
    startDate { year month day } format status episodes duration genres
    studios { nodes { name isAnimationStudio } }
    season seasonYear nextAiringEpisode { episode airingAt }
    relations { edges { relationType node { id title { romaji english native userPreferred } synonyms description(asHtml: false) coverImage { large extraLarge } bannerImage averageScore startDate { year month day } format status episodes duration genres studios { nodes { name isAnimationStudio } } season seasonYear } } }
    recommendations { nodes { media { id title { romaji english native userPreferred } synonyms description(asHtml: false) coverImage { large extraLarge } bannerImage averageScore startDate { year month day } format status episodes duration genres studios { nodes { name isAnimationStudio } } season seasonYear } } }
  }
}`

async function requestAniList<T extends AniListResponse>(query: string, variables: Record<string, unknown>, fetcher: typeof fetch = fetch): Promise<T> {
  let response: Response
  try {
    response = await fetchWithTimeout(fetcher, ANILIST_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: 900 },
    } as RequestInit)
  } catch (error) {
    if (error instanceof ProviderTimeoutError) {
      throw new AniListError('ANILIST_NETWORK_ERROR', 'AniList request timed out')
    }
    throw new AniListError('ANILIST_NETWORK_ERROR')
  }

  if (response.status === 429) throw new AniListError('ANILIST_RATE_LIMITED')
  if (response.status === 404) throw new AniListError('ANILIST_NOT_FOUND')
  if (!response.ok) throw new AniListError('ANILIST_REQUEST_FAILED')

  let data: T
  try {
    data = await response.json() as T
  } catch {
    throw new AniListError('ANILIST_INVALID_RESPONSE')
  }
  if (data.errors?.length) throw new AniListError('ANILIST_REQUEST_FAILED')
  return data
}

export interface AnimeSearchOptions {
  query?: string
  genre?: string
  status?: string
  sort?: string
  page?: number
  perPage?: number
  format?: string
}

function mapSort(value?: string): string[] {
  if (value === 'score' || value === 'SCORE_DESC') return ['SCORE_DESC']
  if (value === 'updated') return ['UPDATED_AT_DESC']
  if (value === 'recent') return ['START_DATE_DESC']
  return ['POPULARITY_DESC']
}

export async function searchAnime(options: AnimeSearchOptions, fetcher: typeof fetch = fetch): Promise<CatalogMediaItem[]> {
  const data = await requestAniList<{ data?: { Page?: { media?: AniListMedia[] | null } }; errors?: Array<{ message?: string }> }>(SEARCH_QUERY, {
    page: options.page ?? 1,
    perPage: options.perPage ?? 24,
    search: options.query?.trim() || undefined,
    genre: options.genre || undefined,
    status: ['RELEASING', 'FINISHED', 'NOT_YET_RELEASED', 'CANCELLED', 'HIATUS'].includes(options.status ?? '') ? options.status : undefined,
    format: ['TV', 'MOVIE', 'ONA', 'OVA', 'SPECIAL', 'MUSIC'].includes(options.format ?? '') ? options.format : undefined,
    sort: mapSort(options.sort),
  }, fetcher)
  return (data.data?.Page?.media ?? []).map(mapBaseAnime)
}

export const getAnimeDetail = cache(async (id: string | number): Promise<AnimeDetail> => {
  const numericId = Number(id)
  if (!Number.isSafeInteger(numericId) || numericId <= 0) throw new AniListError('ANILIST_NOT_FOUND')
  const data = await requestAniList(DETAIL_QUERY, { id: numericId })
  const media = data.data?.Media
  if (!media) throw new AniListError('ANILIST_NOT_FOUND')
  const detail = mapAniListAnime(media)
  try {
    detail.episodesList = await getAnimeEpisodes(numericId)
    detail.episodesStatus = detail.episodesList.length > 0 ? 'available' : 'empty'
  } catch {
    // AniList remains the source of truth for detail metadata when episode enrichment is unavailable.
    detail.episodesStatus = 'unavailable'
  }
  return detail
})

export { canonicalMediaId }
