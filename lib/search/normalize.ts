import type { AnimeListItem } from '@/lib/anilist'
import type { Media } from '@/lib/tmdb'
import type { MediaSearchResult } from './types'

export function normalizeTmdbSearchResult(item: Media): MediaSearchResult | null {
  if ((item.media_type !== 'movie' && item.media_type !== 'tv') || !Number.isSafeInteger(item.id) || item.id < 1) return null
  const title = item.title || item.name
  if (!title) return null
  return {
    ref: { source: 'tmdb', sourceId: item.id, kind: item.media_type },
    title,
    originalTitle: item.title || item.name,
    year: Number((item.release_date || item.first_air_date || '').slice(0, 4)) || undefined,
    posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : undefined,
    backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined,
    rating: item.vote_average,
    popularity: item.popularity,
  }
}

export function normalizeAnimeSearchResult(item: AnimeListItem): MediaSearchResult {
  return {
    ref: { source: 'anilist', sourceId: item.sourceId, kind: 'anime' },
    title: item.title,
    originalTitle: item.originalTitle,
    year: item.year,
    posterUrl: item.posterUrl,
    backdropUrl: item.bannerUrl,
    rating: item.score,
    popularity: item.popularity,
  }
}
