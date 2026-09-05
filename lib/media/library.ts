import type { LibraryMediaType } from './types'

export interface LibraryMediaIdentity {
  id: number
  media_type: LibraryMediaType
  sourceId?: number
}

export function libraryMediaHref(item: LibraryMediaIdentity): string {
  const id = item.media_type === 'anime' ? item.sourceId ?? item.id : item.id
  return `/${item.media_type}/${id}`
}
