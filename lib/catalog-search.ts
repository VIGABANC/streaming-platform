import { AniListError, searchAnime } from './anilist'
import type { CatalogMediaItem } from './catalog-model'
import { searchMulti, titleOf, type Media, type MediaType, TMDBError } from './tmdb'

export type SearchCatalogItem = (Media & CatalogMediaItem) & { media_type: MediaType }

export interface CatalogSearchSourceState {
  status: 'success' | 'failure'
  errorCode?: string
}

export interface CatalogSearchResult {
  results: SearchCatalogItem[]
  partial: boolean
  sources: { tmdb: CatalogSearchSourceState; anilist: CatalogSearchSourceState }
}

function sourceId(item: Pick<SearchCatalogItem, 'source' | 'sourceId' | 'id' | 'media_type'>): string {
  return item.sourceId ? `${item.source}:${item.sourceId}` : `${item.source}:${item.media_type}:${item.id}`
}

function normalizeTMDBItem(item: Media): SearchCatalogItem | null {
  if (item.media_type !== 'movie' && item.media_type !== 'tv') return null
  const mediaType = item.media_type as 'movie' | 'tv'
  const title = titleOf(item)
  return {
    ...item,
    title,
    media_type: mediaType,
    source: 'tmdb',
    sourceId: String(item.id),
    canonicalId: `tmdb:${mediaType}:${item.id}`,
    alternativeTitles: [],
    posterUrl: null,
    backdropUrl: null,
    attribution: 'TMDB',
  }
}

function toSearchError(errors: unknown[]): Error {
  const first = errors[0]
  if (first instanceof TMDBError || first instanceof AniListError) return first
  return new Error('All catalog sources failed')
}

export function dedupeSearchResults(items: SearchCatalogItem[]): SearchCatalogItem[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.canonicalId || sourceId(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function rankSearchResults(items: SearchCatalogItem[], query: string): SearchCatalogItem[] {
  const normalized = query.trim().toLocaleLowerCase()
  const rank = (item: SearchCatalogItem) => {
    const titles = [item.title, item.originalTitle, ...(item.alternativeTitles ?? [])]
      .filter(Boolean)
      .map((value) => value!.toLocaleLowerCase())
    if (titles.some((title) => title === normalized)) return 0
    if (titles.some((title) => title.startsWith(normalized))) return 1
    if (titles.some((title) => title.includes(normalized))) return 2
    return 3
  }
  return [...items].sort((a, b) => rank(a) - rank(b) || (b.vote_average ?? 0) - (a.vote_average ?? 0) || (b.popularity ?? 0) - (a.popularity ?? 0))
}

export async function searchCatalog(query: string): Promise<CatalogSearchResult> {
  const [tmdbResult, animeResult] = await Promise.allSettled([searchMulti(query), searchAnime({ query })])
  const sources = {
    tmdb: tmdbResult.status === 'fulfilled'
      ? { status: 'success' as const }
      : { status: 'failure' as const, errorCode: tmdbResult.reason instanceof Error ? tmdbResult.reason.name : 'TMDB_UNKNOWN' },
    anilist: animeResult.status === 'fulfilled'
      ? { status: 'success' as const }
      : { status: 'failure' as const, errorCode: animeResult.reason instanceof Error ? animeResult.reason.name : 'ANILIST_UNKNOWN' },
  }

  if (tmdbResult.status === 'rejected' && animeResult.status === 'rejected') {
    throw toSearchError([tmdbResult.reason, animeResult.reason])
  }

  const tmdbItems = tmdbResult.status === 'fulfilled'
    ? tmdbResult.value.results.map(normalizeTMDBItem).filter((item): item is SearchCatalogItem => Boolean(item))
    : []
  const animeItems = animeResult.status === 'fulfilled' ? animeResult.value as SearchCatalogItem[] : []
  const results = rankSearchResults(dedupeSearchResults([...tmdbItems, ...animeItems]), query)

  return {
    results,
    partial: tmdbResult.status !== animeResult.status,
    sources,
  }
}
