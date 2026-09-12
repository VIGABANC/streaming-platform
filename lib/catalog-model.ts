import type { Media, MediaType } from './tmdb'

export type CatalogSource = 'tmdb' | 'anilist'

export interface CatalogTitles {
  preferred: string
  original?: string
  alternatives?: string[]
}

export interface SeasonSummary {
  id: number | string
  number: number
  title: string
  episodeCount?: number
  airDate?: string
}

export interface EpisodeSummary {
  id: number | string
  number: number
  title: string
  overview?: string
  airDate?: string
  duration?: number
  imageUrl?: string | null
}

export interface CatalogMediaItem extends Media {
  media_type: MediaType
  source: CatalogSource
  sourceId: string
  canonicalId: string
  title: string
  originalTitle?: string
  alternativeTitles: string[]
  posterUrl?: string | null
  backdropUrl?: string | null
  genres?: string[]
  status?: string
  format?: string
  episodes?: number | null
  duration?: number | null
  studios?: string[]
  attribution: string
}

export interface AnimeDetail extends CatalogMediaItem {
  media_type: 'anime'
  seasons: SeasonSummary[]
  episodesList: EpisodeSummary[]
  episodesStatus: 'available' | 'unavailable' | 'empty'
  relations: CatalogMediaItem[]
  recommendations: CatalogMediaItem[]
  nextAiringEpisode?: { number: number; airingAt: number } | null
}

export function canonicalMediaId(item: Pick<CatalogMediaItem, 'source' | 'media_type' | 'id'>): string {
  return `${item.source}:${item.media_type}:${item.id}`
}

export function normalizeTitles(titles: CatalogTitles): string[] {
  return [titles.preferred, titles.original, ...(titles.alternatives ?? [])]
    .map((title) => title?.trim())
    .filter((title): title is string => Boolean(title))
    .filter((title, index, all) => all.findIndex((candidate) => candidate.toLocaleLowerCase() === title.toLocaleLowerCase()) === index)
}

export function releaseDate(year?: number | null, month?: number | null, day?: number | null): string {
  if (!year) return ''
  return [year, month, day].filter((part): part is number => Boolean(part)).map((part, index) => index === 0 ? String(part).padStart(4, '0') : String(part).padStart(2, '0')).join('-')
}
