import type {
  ContinueWatchingItem,
  FavoriteItem,
  HistoryItem,
  RatingItem,
  UserProfile,
  UserSettings,
  WatchlistItem,
} from '@/lib/store'
import { ensureMediaRef, parseMediaRef, legacyMediaRef, type LibraryMediaType, type MediaRef } from '@/lib/media/types'

type SourceAware<T extends { media_type: LibraryMediaType }> = T & MediaRef

export interface LibrarySnapshotV2 {
  version: 2
  exportedAt: string
  watchlist: SourceAware<WatchlistItem>[]
  favorites: SourceAware<FavoriteItem>[]
  ratings: SourceAware<RatingItem>[]
  history: SourceAware<HistoryItem>[]
  continueWatching: SourceAware<ContinueWatchingItem>[]
  profile: UserProfile
  settings: UserSettings
}

function migrateRecord<T extends { media_type: LibraryMediaType }>(value: unknown, requireExplicitIdentity: boolean): SourceAware<T> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  const hasExplicitIdentity = 'source' in candidate || 'sourceId' in candidate || 'kind' in candidate
  const ref = hasExplicitIdentity || requireExplicitIdentity ? parseMediaRef(candidate) : legacyMediaRef(candidate)
  if (!ref || ref.kind !== candidate.media_type) return null
  try {
    return ensureMediaRef(candidate as T) as SourceAware<T>
  } catch {
    return null
  }
}

function migrateCollection<T extends { media_type: LibraryMediaType }>(value: unknown, requireExplicitIdentity: boolean): SourceAware<T>[] | null {
  if (!Array.isArray(value)) return null
  const migrated = value.map((item) => migrateRecord<T>(item, requireExplicitIdentity))
  return migrated.every((item): item is SourceAware<T> => item !== null) ? migrated : null
}

export function migrateLibrarySnapshot(value: unknown): LibrarySnapshotV2 | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const candidate = value as Record<string, unknown>
  if (candidate.version !== 1 && candidate.version !== 2) return null

  const requireExplicitIdentity = candidate.version === 2
  const watchlist = migrateCollection<WatchlistItem>(candidate.watchlist, requireExplicitIdentity)
  const favorites = migrateCollection<FavoriteItem>(candidate.favorites, requireExplicitIdentity)
  const ratings = migrateCollection<RatingItem>(candidate.ratings, requireExplicitIdentity)
  const history = migrateCollection<HistoryItem>(candidate.history, requireExplicitIdentity)
  const continueWatching = migrateCollection<ContinueWatchingItem>(candidate.continueWatching, requireExplicitIdentity)
  if (!watchlist || !favorites || !ratings || !history || !continueWatching) return null
  if (typeof candidate.exportedAt !== 'string' || !candidate.profile || !candidate.settings) return null

  return {
    version: 2,
    exportedAt: candidate.exportedAt,
    watchlist,
    favorites,
    ratings,
    history,
    continueWatching,
    profile: candidate.profile as UserProfile,
    settings: candidate.settings as UserSettings,
  }
}
