import type {
  Genre,
  Media,
  MediaType,
  MovieDetail,
  SeasonDetail,
  TVDetail,
  WatchProvider,
} from '@/lib/tmdb'
import { getGenreNames } from '@/lib/tmdb'

export interface LandingLists {
  trending: Media[]
  popularMovies: Media[]
  popularTV: Media[]
  topRatedMovies: Media[]
  topRatedTV: Media[]
  nowPlaying: Media[]
  airingToday: Media[]
}

export interface LandingDetail {
  detail: MovieDetail | TVDetail
  season?: SeasonDetail
  providers?: WatchProvider[]
}

export interface LandingData {
  lists: LandingLists
  detail?: LandingDetail
}

export function mediaTypeOf(item: Media): MediaType {
  return item.media_type === 'tv' ? 'tv' : 'movie'
}

export function mediaHref(item: Media): string {
  return `/${mediaTypeOf(item)}/${item.id}`
}

function isUsableMedia(item: Media): boolean {
  return item.media_type !== 'person' && Boolean(item.id)
}

export function usableMedia(items: Media[], limit?: number): Media[] {
  const candidates = items.filter(isUsableMedia)
  const withPoster = candidates.filter((item) => Boolean(item.poster_path))
  const usable = withPoster.length > 0 ? withPoster : candidates

  return limit === undefined ? usable : usable.slice(0, Math.max(0, limit))
}

export function firstWithBackdrop(items: Media[]): Media | undefined {
  return items.find((item) => isUsableMedia(item) && Boolean(item.backdrop_path))
}

export function firstMovieWithBackdrop(items: Media[]): Media | undefined {
  return firstWithBackdrop(items.filter((item) => item.media_type === 'movie'))
}

type MediaWithNamedGenres = Media & { genres?: Genre[] }

export function heroGenreNames(item: MediaWithNamedGenres): string[] {
  const namedGenres = item.genres
    ?.map((genre) => genre.name.trim())
    .filter(Boolean)

  return (namedGenres?.length
    ? namedGenres
    : getGenreNames(item.genre_ids, item.media_type === 'tv' ? 'tv' : 'movie'))
    .slice(0, 3)
}
