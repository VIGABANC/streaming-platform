import type { Media, MediaType } from '@/lib/tmdb'

export type SearchShowcaseState = 'idle' | 'loading' | 'results' | 'empty' | 'error'
export type SearchShowcaseResult = Media & { media_type: MediaType }

export function normalizeSearchResults(payload: unknown): SearchShowcaseResult[] {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as { results?: unknown }).results)) return []
  return (payload as { results: Media[] }).results.filter((item): item is SearchShowcaseResult =>
    Boolean(item?.id) && (item.media_type === 'movie' || item.media_type === 'tv'),
  )
}

export function searchShowcaseStatus(state: SearchShowcaseState, count = 0, query = ''): string {
  switch (state) {
    case 'loading': return `Searching the catalog for ${query || 'titles'}…`
    case 'results': return `${count} ${count === 1 ? 'signal' : 'signals'} found${query ? ` for ${query}` : ''}.`
    case 'empty': return `No signals found${query ? ` for ${query}` : ''}.`
    case 'error': return 'Search is unavailable right now. Your query is still here.'
    default: return 'Enter at least two characters to search the catalog.'
  }
}
