import { describe, expect, it } from 'vitest'
import { migrateLibrarySnapshot } from '@/lib/library/migration'

const v1Snapshot = {
  version: 1,
  exportedAt: '2026-09-05T12:00:00.000Z',
  watchlist: [{ id: 123, media_type: 'movie', title: 'A film', addedAt: 1 }],
  favorites: [],
  ratings: [],
  history: [],
  continueWatching: [],
  profile: { name: 'Night Signal', avatar: 'signal-red', bio: '', joinedAt: 1 },
  settings: { autoplayNext: true, defaultServer: 'vidsrc-wiki', streamQuality: 'auto', ambientLighting: true, reducedMotion: false },
}

describe('library snapshot migration', () => {
  it('migrates legacy TMDB records to explicit source-aware records', () => {
    const migrated = migrateLibrarySnapshot(v1Snapshot)

    expect(migrated?.version).toBe(2)
    expect(migrated?.watchlist[0]).toMatchObject({
      id: 123,
      media_type: 'movie',
      source: 'tmdb',
      sourceId: 123,
      kind: 'movie',
    })
  })

  it('rejects malformed source-aware records', () => {
    expect(migrateLibrarySnapshot({ ...v1Snapshot, version: 2, watchlist: [{ ...v1Snapshot.watchlist[0], source: 'unknown' }] })).toBeNull()
  })
})
