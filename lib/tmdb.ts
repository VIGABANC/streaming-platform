// ─────────────────────────────────────────────────────────────────────────────
// TMDB API Library
// Server-side only. Never import TMDB_API_KEY in client components.
// ─────────────────────────────────────────────────────────────────────────────

export type MediaType = 'movie' | 'tv'

// ── Base media (used in lists / search results) ──────────────────────────────

export interface Media {
  id: number
  title?: string
  name?: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  release_date?: string
  first_air_date?: string
  media_type?: MediaType | 'person'
  genre_ids?: number[]
  runtime?: number
  original_language?: string
  popularity?: number
  vote_count?: number
}

// ── Detail types ──────────────────────────────────────────────────────────────

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  name: string
  logo_path?: string | null
  origin_country?: string
}

export interface CastMember {
  id: number
  name: string
  character: string
  profile_path?: string | null
  order?: number
}

export interface CrewMember {
  id: number
  name: string
  job: string
  department: string
  profile_path?: string | null
}

export interface Credits {
  cast: CastMember[]
  crew: CrewMember[]
}

export interface Video {
  id: string
  key: string
  name: string
  site: string
  type: string
  official: boolean
}

export interface Season {
  id: number
  name: string
  season_number: number
  episode_count: number
  poster_path?: string | null
  air_date?: string
  overview?: string
}

export interface Episode {
  id: number
  name: string
  overview?: string
  episode_number: number
  season_number: number
  still_path?: string | null
  air_date?: string
  runtime?: number
  vote_average?: number
}

export interface SeasonDetail {
  id: number
  name: string
  season_number: number
  episodes: Episode[]
  air_date?: string
  overview?: string
  poster_path?: string | null
}

export interface ContentRating {
  iso_3166_1: string
  rating: string
}

export interface ReleaseDateResult {
  iso_3166_1: string
  release_dates: { certification: string; type: number }[]
}

export interface MovieDetail extends Media {
  media_type: 'movie'
  genres: Genre[]
  production_companies: ProductionCompany[]
  original_title?: string
  tagline?: string
  status?: string
  budget?: number
  revenue?: number
  credits?: Credits
  videos?: { results: Video[] }
  recommendations?: { results: Media[] }
  similar?: { results: Media[] }
  release_dates?: { results: ReleaseDateResult[] }
}

export interface TVDetail extends Media {
  media_type: 'tv'
  genres: Genre[]
  production_companies: ProductionCompany[]
  original_name?: string
  tagline?: string
  status?: string
  number_of_seasons?: number
  number_of_episodes?: number
  seasons?: Season[]
  credits?: Credits
  videos?: { results: Video[] }
  recommendations?: { results: Media[] }
  similar?: { results: Media[] }
  content_ratings?: { results: ContentRating[] }
  in_production?: boolean
  networks?: { id: number; name: string; logo_path?: string | null }[]
}

// ── Error types ───────────────────────────────────────────────────────────────

export type TMDBErrorCode =
  | 'TMDB_API_KEY_MISSING'
  | 'TMDB_AUTH_FAILED'
  | 'TMDB_NOT_FOUND'
  | 'TMDB_REQUEST_FAILED'
  | 'TMDB_NETWORK_ERROR'

export class TMDBError extends Error {
  constructor(
    public readonly code: TMDBErrorCode,
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'TMDBError'
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export const titleOf = (m: Pick<Media, 'title' | 'name'>) =>
  m.title || m.name || 'Untitled'

export const yearOf = (m: Pick<Media, 'release_date' | 'first_air_date'>) =>
  (m.release_date || m.first_air_date || '').slice(0, 4)

export const poster = (path?: string | null, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '/poster-fallback.svg'

export const backdrop = (path?: string | null, size = 'w1280') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '/backdrop-fallback.svg'

export const profileImage = (path?: string | null) =>
  path ? `https://image.tmdb.org/t/p/w185${path}` : '/placeholder-user.jpg'

export function formatRuntime(minutes?: number): string {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function getCertification(movie: MovieDetail): string {
  const us = movie.release_dates?.results?.find(
    (r) => r.iso_3166_1 === 'US',
  )
  if (!us) return ''
  const cert = us.release_dates.find((d) => d.certification)?.certification
  return cert ?? ''
}

export function getTVRating(show: TVDetail): string {
  const us = show.content_ratings?.results?.find(
    (r) => r.iso_3166_1 === 'US',
  )
  return us?.rating ?? ''
}

export function getTrailer(videos?: { results: Video[] }): Video | undefined {
  if (!videos?.results?.length) return undefined
  return (
    videos.results.find(
      (v) => v.type === 'Trailer' && v.site === 'YouTube' && v.official,
    ) ??
    videos.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube') ??
    videos.results.find((v) => v.site === 'YouTube')
  )
}

// ── API core ──────────────────────────────────────────────────────────────────

const API = 'https://api.themoviedb.org/3'

function apiKey(): string {
  const k = process.env.TMDB_API_KEY
  if (!k) throw new TMDBError('TMDB_API_KEY_MISSING')
  return k
}

async function tmdb<T>(path: string, revalidate = 300): Promise<T> {
  const key = apiKey()
  const sep = path.includes('?') ? '&' : '?'
  let res: Response
  try {
    res = await fetch(`${API}${path}${sep}api_key=${key}`, {
      next: { revalidate },
    })
  } catch {
    throw new TMDBError('TMDB_NETWORK_ERROR', 'Failed to reach TMDB')
  }

  if (res.status === 401) throw new TMDBError('TMDB_AUTH_FAILED', 'Invalid TMDB API key')
  if (res.status === 404) throw new TMDBError('TMDB_NOT_FOUND', `Not found: ${path}`)
  if (!res.ok) throw new TMDBError('TMDB_REQUEST_FAILED', `TMDB error ${res.status}`)

  return res.json() as Promise<T>
}

// ── List helpers ──────────────────────────────────────────────────────────────

const list = (path: string, revalidate?: number) =>
  tmdb<{ results: Media[] }>(path, revalidate)

// ── Trending / popular ────────────────────────────────────────────────────────

export const getTrending = () => list('/trending/all/day', 3600)
export const getTrendingMovies = () => list('/trending/movie/day', 3600)
export const getTrendingTV = () => list('/trending/tv/day', 3600)
export const getPopularMovies = () => list('/movie/popular', 3600)
export const getPopularTV = () => list('/tv/popular', 3600)
export const getTopRatedMovies = () => list('/movie/top_rated', 86400)
export const getTopRatedTV = () => list('/tv/top_rated', 86400)
export const getNowPlaying = () => list('/movie/now_playing', 3600)
export const getUpcoming = () => list('/movie/upcoming', 3600)
export const getAiringToday = () => list('/tv/airing_today', 3600)
export const getOnTheAir = () => list('/tv/on_the_air', 3600)

// ── Search ────────────────────────────────────────────────────────────────────

export const searchMulti = (query: string) =>
  tmdb<{ results: Media[] }>(
    `/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
    0, // never cache search results
  )

// ── Discover ──────────────────────────────────────────────────────────────────

export const discover = (type: MediaType, params = '') =>
  list(`/discover/${type}?include_adult=false&${params}`, 1800)

// ── Detail ────────────────────────────────────────────────────────────────────

export async function getMovieDetail(id: string | number): Promise<MovieDetail> {
  return tmdb<MovieDetail>(
    `/movie/${id}?append_to_response=credits,recommendations,similar,videos,release_dates`,
    3600,
  ).then((d) => ({ ...d, media_type: 'movie' as const }))
}

export async function getTVDetail(id: string | number): Promise<TVDetail> {
  return tmdb<TVDetail>(
    `/tv/${id}?append_to_response=credits,recommendations,similar,videos,content_ratings`,
    3600,
  ).then((d) => ({ ...d, media_type: 'tv' as const }))
}

/** @deprecated use getMovieDetail / getTVDetail */
export async function getDetail(type: MediaType, id: string) {
  if (type === 'movie') return getMovieDetail(id)
  return getTVDetail(id)
}

export async function getSeason(
  id: string | number,
  season: number,
): Promise<SeasonDetail> {
  return tmdb<SeasonDetail>(`/tv/${id}/season/${season}`, 3600)
}

// ── Genre lists ───────────────────────────────────────────────────────────────

export const genres = {
  movie: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ],
  tv: [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
  ],
}

export const languageOptions = [
  { code: '', name: 'All Languages' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'it', name: 'Italian' },
]

export const sortOptions = {
  movie: [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'release_date.desc', label: 'Newest First' },
    { value: 'revenue.desc', label: 'Highest Grossing' },
  ],
  tv: [
    { value: 'popularity.desc', label: 'Most Popular' },
    { value: 'vote_average.desc', label: 'Highest Rated' },
    { value: 'first_air_date.desc', label: 'Newest First' },
  ],
}
