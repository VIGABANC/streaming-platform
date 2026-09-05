import type { AnimeListItem } from '@/lib/anilist'
import { searchMulti, getWatchProviders, type WatchProviderRegion } from '@/lib/tmdb'
import { cache } from 'react'

export interface TmdbMappingCandidate {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  original_title?: string
  original_name?: string
  release_date?: string
  first_air_date?: string
}

export interface MediaMapping {
  anilistId: number
  tmdbId: number
  tmdbKind: 'movie' | 'tv'
  confidence: 'high' | 'medium'
  matchedBy: 'external-id' | 'title-year'
}

function normalizeTitle(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')
}

function animeYear(anime: AnimeListItem): string | undefined {
  return anime.year ? String(anime.year) : undefined
}

function candidateYear(candidate: TmdbMappingCandidate): string | undefined {
  return (candidate.release_date || candidate.first_air_date || '').slice(0, 4) || undefined
}

export function mapAnimeToTmdb(
  anime: AnimeListItem,
  candidates: TmdbMappingCandidate[],
  external?: { tmdbId?: number; tmdbKind?: 'movie' | 'tv' },
): MediaMapping | null {
  if (!Number.isSafeInteger(anime.sourceId) || anime.sourceId < 1) return null

  if (external?.tmdbId && external.tmdbKind && Number.isSafeInteger(external.tmdbId) && external.tmdbId > 0) {
    const verified = candidates.find((candidate) => candidate.id === external.tmdbId && candidate.media_type === external.tmdbKind)
    if (verified) return { anilistId: anime.sourceId, tmdbId: external.tmdbId, tmdbKind: external.tmdbKind, confidence: 'high', matchedBy: 'external-id' }
  }

  const desiredKind = anime.format === 'MOVIE' ? 'movie' : 'tv'
  const titleCandidates = [anime.title, anime.originalTitle, anime.romajiTitle].filter((value): value is string => Boolean(value)).map(normalizeTitle)
  const year = animeYear(anime)
  const matches = candidates.filter((candidate) => {
    if (candidate.media_type !== desiredKind) return false
    const candidateTitles = [candidate.title, candidate.name, candidate.original_title, candidate.original_name].filter((value): value is string => Boolean(value)).map(normalizeTitle)
    return titleCandidates.some((title) => candidateTitles.includes(title)) && candidateYear(candidate) === year
  })
  if (matches.length !== 1) return null

  return { anilistId: anime.sourceId, tmdbId: matches[0].id, tmdbKind: matches[0].media_type, confidence: 'high', matchedBy: 'title-year' }
}

export const getAnimeProviderAvailability = cache(async (anime: AnimeListItem, region = 'US'): Promise<{ mapping: MediaMapping; providers: WatchProviderRegion } | null> => {
  try {
    const search = await searchMulti(anime.title)
    const candidates = (search.results ?? []).filter((item): item is TmdbMappingCandidate => item.media_type === 'movie' || item.media_type === 'tv')
    const mapping = mapAnimeToTmdb(anime, candidates)
    if (!mapping || mapping.confidence !== 'high') return null
    const providers = await getWatchProviders(mapping.tmdbKind, mapping.tmdbId, region)
    return { mapping, providers }
  } catch {
    return null
  }
})
