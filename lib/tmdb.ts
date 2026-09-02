export type MediaType = 'movie' | 'tv'
export type Media = {
  id: number
  title?: string
  name?: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  release_date?: string
  first_air_date?: string
  media_type?: MediaType
  genre_ids?: number[]
  runtime?: number
}

const API = 'https://api.themoviedb.org/3'
const key = () => process.env.NEXT_PUBLIC_TMDB_API_KEY
export const titleOf = (m: Media) => m.title || m.name || 'Untitled'
export const yearOf = (m: Media) => (m.release_date || m.first_air_date || '').slice(0, 4)
export const poster = (path?: string | null, size = 'w500') => path ? `https://image.tmdb.org/t/p/${size}${path}` : '/poster-fallback.svg'
export const backdrop = (path?: string | null) => path ? `https://image.tmdb.org/t/p/w1280${path}` : '/backdrop-fallback.svg'

async function tmdb<T>(path: string): Promise<T> {
  const token = key()
  if (!token) throw new Error('TMDB_API_KEY_MISSING')
  const res = await fetch(`${API}${path}${path.includes('?') ? '&' : '?'}api_key=${token}`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error('TMDB_REQUEST_FAILED')
  return res.json()
}

export const getList = (path: string) => tmdb<{ results: Media[] }>(path)
export const getTrending = () => getList('/trending/all/day')
export const getPopularMovies = () => getList('/movie/popular')
export const getPopularTV = () => getList('/tv/popular')
export const getTopRatedMovies = () => getList('/movie/top_rated')
export const getTopRatedTV = () => getList('/tv/top_rated')
export const getNowPlaying = () => getList('/movie/now_playing')
export const getUpcoming = () => getList('/movie/upcoming')
export const searchMulti = (query: string) => getList(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false`)
export const discover = (type: MediaType, params = '') => getList(`/discover/${type}?include_adult=false&${params}`)
export async function getDetail(type: MediaType, id: string) {
  return tmdb<Media & { genres?: { id: number; name: string }[]; seasons?: { season_number: number; name: string; episode_count: number }[]; credits?: { cast: Media[] } }>(`/${type}/${id}?append_to_response=credits,recommendations`)
}
export async function getSeason(id: string, season: number) { return tmdb<{ episodes: (Media & { episode_number: number; season_number: number; still_path?: string; air_date?: string })[] }>(`/tv/${id}/season/${season}`) }
export const genres = { movie: [{id:28,name:'Action'},{id:35,name:'Comedy'},{id:18,name:'Drama'},{id:878,name:'Science Fiction'},{id:53,name:'Thriller'}], tv: [{id:10759,name:'Action & Adventure'},{id:35,name:'Comedy'},{id:18,name:'Drama'},{id:10765,name:'Sci-Fi & Fantasy'}] }
