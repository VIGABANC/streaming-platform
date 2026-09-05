export type MediaSource = 'tmdb' | 'anilist'
export type MediaKind = 'movie' | 'tv' | 'anime'
export type LibraryMediaType = MediaKind

export interface MediaRef {
  source: MediaSource
  sourceId: number
  kind: MediaKind
}

export interface EpisodeRef {
  season?: number
  episode?: number
}

export function sourceKey(ref: MediaRef, episode?: EpisodeRef): string {
  if (!Number.isSafeInteger(ref.sourceId) || ref.sourceId < 1) throw new Error('INVALID_MEDIA_REF')
  const parts = [`${ref.source}:${ref.kind}:${ref.sourceId}`]
  if (episode?.season !== undefined) {
    if (!Number.isSafeInteger(episode.season) || episode.season < 0) throw new Error('INVALID_SEASON')
    parts.push(`s${episode.season}`)
  }
  if (episode?.episode !== undefined) {
    if (!Number.isSafeInteger(episode.episode) || episode.episode < 1) throw new Error('INVALID_EPISODE')
    parts.push(`e${episode.episode}`)
  }
  return parts.join(':')
}

export function parseMediaRef(value: unknown): MediaRef | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  if ((candidate.source !== 'tmdb' && candidate.source !== 'anilist') ||
      (candidate.kind !== 'movie' && candidate.kind !== 'tv' && candidate.kind !== 'anime') ||
      typeof candidate.sourceId !== 'number' || !Number.isSafeInteger(candidate.sourceId) || candidate.sourceId < 1) {
    return null
  }
  return { source: candidate.source, sourceId: candidate.sourceId, kind: candidate.kind }
}

export function legacyMediaRef(value: unknown): MediaRef | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  if (typeof candidate.id !== 'number' || !Number.isSafeInteger(candidate.id) || candidate.id < 1) return null
  if (candidate.media_type !== 'movie' && candidate.media_type !== 'tv') return null
  return { source: 'tmdb', sourceId: candidate.id, kind: candidate.media_type }
}

export function ensureMediaRef<T extends object>(value: T): T & MediaRef {
  const ref = parseMediaRef(value) ?? legacyMediaRef(value)
  if (!ref) throw new Error('INVALID_MEDIA_REF')
  return { ...value, ...ref }
}
