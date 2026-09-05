import { anilistGraphql, assertAniListId, AniListError } from './client'
import { ANIME_DETAIL_QUERY, ANIME_LIST_QUERY } from './queries'
import type { AnimeDetail, AnimeFormat, AnimeListItem, AnimeMediaResponse, AnimePageResponse } from './types'

interface RawTitle { romaji?: string | null; english?: string | null; native?: string | null }
interface RawMedia {
  id: number
  title?: RawTitle
  seasonYear?: number | null
  season?: string | null
  format?: string | null
  status?: string | null
  episodes?: number | null
  averageScore?: number | null
  popularity?: number | null
  description?: string | null
  coverImage?: { large?: string | null }
  bannerImage?: string | null
}

const FORMATS = new Set<AnimeFormat>(['TV', 'TV_SHORT', 'MOVIE', 'OVA', 'ONA', 'SPECIAL', 'MUSIC'])
const stripHtml = (value: string | null | undefined) => value?.replace(/<[^>]*>/g, '').trim() || undefined

function titleOf(raw: RawMedia): string {
  return raw.title?.english || raw.title?.romaji || raw.title?.native || 'Untitled anime'
}

export function normalizeAnimeListItem(raw: RawMedia): AnimeListItem {
  return {
    source: 'anilist',
    sourceId: raw.id,
    kind: 'anime',
    title: titleOf(raw),
    originalTitle: raw.title?.native || undefined,
    romajiTitle: raw.title?.romaji || undefined,
    year: raw.seasonYear || undefined,
    season: raw.season || undefined,
    format: raw.format && FORMATS.has(raw.format as AnimeFormat) ? raw.format as AnimeFormat : undefined,
    status: raw.status || undefined,
    episodes: raw.episodes || undefined,
    score: raw.averageScore ? raw.averageScore / 10 : undefined,
    popularity: raw.popularity || undefined,
    posterUrl: raw.coverImage?.large || undefined,
    bannerUrl: raw.bannerImage || undefined,
    description: stripHtml(raw.description),
  }
}

function normalizeAnimeDetail(raw: RawMedia & Record<string, unknown>): AnimeDetail {
  const base = normalizeAnimeListItem(raw)
  const studios = (raw.studios as { nodes?: Array<{ id: number; name: string }>; edges?: Array<{ isMain?: boolean }> } | undefined)
  const characters = raw.characters as { edges?: Array<{ node?: { id: number; name?: { full?: string | null }; image?: { large?: string | null } }; role?: string; voiceActors?: Array<{ name?: { full?: string | null } }> }> } | undefined
  const staff = raw.staff as { edges?: Array<{ node?: { id: number; name?: { full?: string | null }; image?: { large?: string | null } }; roles?: string[] }> } | undefined
  const relations = raw.relations as { edges?: Array<{ relationType?: string; node?: RawMedia & { type?: string } }> } | undefined
  const recommendations = raw.recommendations as { nodes?: Array<{ mediaRecommendation?: RawMedia & { type?: string } }> } | undefined
  const nextAiringEpisode = raw.nextAiringEpisode as { episode?: number; airingAt?: number } | null | undefined
  const trailer = raw.trailer as { site?: string; id?: string; thumbnail?: string | null } | null | undefined
  const externalLinks = raw.externalLinks as Array<{ site?: string; id?: number }> | undefined
  const airingAt = nextAiringEpisode?.airingAt
  const isFuture = typeof airingAt === 'number' && airingAt > Math.floor(Date.now() / 1000)
  const malId = externalLinks?.find((link) => link.site === 'MYANIMELIST')?.id
  const trailerId = trailer?.site?.toLowerCase() === 'youtube' && typeof trailer.id === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(trailer.id) ? trailer.id : undefined

  return {
    ...base,
    japaneseTitle: raw.title?.native || undefined,
    durationMinutes: typeof raw.duration === 'number' && raw.duration > 0 ? raw.duration : undefined,
    genres: Array.isArray(raw.genres) ? raw.genres.filter((value): value is string => typeof value === 'string') : [],
    tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 30).flatMap((tag) => typeof tag === 'object' && tag && typeof tag.id === 'number' && typeof tag.name === 'string' ? [{ id: tag.id, name: tag.name, rank: typeof tag.rank === 'number' ? tag.rank : undefined }] : []) : [],
    studios: studios?.nodes?.map((node, index) => ({ id: node.id, name: node.name, isMain: studios.edges?.[index]?.isMain === true })) || [],
    airing: isFuture ? { status: raw.status || undefined, nextEpisode: nextAiringEpisode?.episode, nextAiringAt: new Date(airingAt * 1000).toISOString() } : undefined,
    characters: characters?.edges?.slice(0, 10).flatMap((edge) => typeof edge.node?.id === 'number' && edge.node.name?.full ? [{ id: edge.node.id, name: edge.node.name.full, imageUrl: edge.node.image?.large || undefined, role: edge.role, voiceActor: edge.voiceActors?.[0]?.name?.full || undefined }] : []) || [],
    staff: staff?.edges?.slice(0, 10).flatMap((edge) => typeof edge.node?.id === 'number' && edge.node.name?.full ? [{ id: edge.node.id, name: edge.node.name.full, role: edge.roles?.[0] || 'Staff', imageUrl: edge.node.image?.large || undefined }] : []) || [],
    relations: relations?.edges?.flatMap((edge) => edge.node?.id && edge.node.type === 'ANIME' && edge.relationType ? [{ relation: edge.relationType, media: normalizeAnimeListItem(edge.node) }] : []) || [],
    recommendations: recommendations?.nodes?.flatMap((entry) => entry.mediaRecommendation?.id && entry.mediaRecommendation.type === 'ANIME' ? [normalizeAnimeListItem(entry.mediaRecommendation)] : []) || [],
    trailer: trailerId ? { site: 'youtube', videoId: trailerId, thumbnailUrl: trailer?.thumbnail || undefined } : undefined,
    externalIds: malId ? { malId } : undefined,
  }
}

export async function getTrendingAnime(): Promise<AnimeListItem[]> {
  const result = await anilistGraphql<AnimePageResponse<RawMedia>>(ANIME_LIST_QUERY, { page: 1, perPage: 24, sort: ['TRENDING_DESC'] }, 900)
  return result.Page.media.map(normalizeAnimeListItem)
}

export async function getAiringAnime(): Promise<AnimeListItem[]> {
  const result = await anilistGraphql<AnimePageResponse<RawMedia>>(ANIME_LIST_QUERY, { page: 1, perPage: 24, sort: ['POPULARITY_DESC'], status: 'RELEASING' }, 300)
  return result.Page.media.map(normalizeAnimeListItem)
}

async function getAnimeList(variables: Record<string, unknown>, revalidate = 900): Promise<AnimeListItem[]> {
  const result = await anilistGraphql<AnimePageResponse<RawMedia>>(ANIME_LIST_QUERY, { page: 1, perPage: 24, ...variables }, revalidate)
  return result.Page.media.map(normalizeAnimeListItem)
}

export function getPopularAnime(): Promise<AnimeListItem[]> {
  return getAnimeList({ sort: ['POPULARITY_DESC'] })
}

export function getTopRatedAnime(): Promise<AnimeListItem[]> {
  return getAnimeList({ sort: ['SCORE_DESC'] })
}

export function getAnimeMovies(): Promise<AnimeListItem[]> {
  return getAnimeList({ sort: ['POPULARITY_DESC'], format: 'MOVIE' })
}

export function getCurrentSeasonAnime(): Promise<AnimeListItem[]> {
  const month = new Date().getUTCMonth() + 1
  const season = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL'
  return getAnimeList({ sort: ['POPULARITY_DESC'], season, seasonYear: new Date().getUTCFullYear() })
}

export async function searchAnime(query: string): Promise<AnimeListItem[]> {
  const normalized = query.trim().replace(/\s+/g, ' ').slice(0, 100)
  if (normalized.length < 2) return []
  const result = await anilistGraphql<AnimePageResponse<RawMedia>>(ANIME_LIST_QUERY, { page: 1, perPage: 24, search: normalized, sort: ['SEARCH_MATCH'] }, 300)
  return result.Page.media.map(normalizeAnimeListItem)
}

export async function getAnimeDetail(id: number): Promise<AnimeDetail> {
  const result = await anilistGraphql<AnimeMediaResponse<RawMedia & Record<string, unknown>>>(ANIME_DETAIL_QUERY, { id: assertAniListId(id) }, 21600)
  if (!result.Media) throw new AniListError('NOT_FOUND', 'Anime was not found')
  return normalizeAnimeDetail(result.Media)
}

export type { AnimeDetail, AnimeListItem } from './types'
export { AniListError } from './client'
