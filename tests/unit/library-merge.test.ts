import { describe, expect, it } from 'vitest'
import { mergeLibrarySnapshots, type LibrarySnapshot } from '@/lib/library/types'

const base: LibrarySnapshot = {
  version: 1,
  exportedAt: '2026-09-05T10:00:00.000Z',
  watchlist: [{ id: 1, media_type: 'movie', title: 'One', addedAt: 10 } as LibrarySnapshot['watchlist'][number]],
  favorites: [],
  ratings: [{ id: 2, media_type: 'tv', rating: 7, ratedAt: 20 }],
  history: [],
  continueWatching: [],
  profile: { name: 'Local', avatar: 'signal-red', bio: '', joinedAt: 1 },
  settings: { autoplayNext: true, defaultServer: 'vidsrc-wiki', streamQuality: 'auto', ambientLighting: true, reducedMotion: false },
}

describe('mergeLibrarySnapshots', () => {
  it('unions collections and keeps the newest timestamped item', () => {
    const remote: LibrarySnapshot = {
      ...base,
      exportedAt: '2026-09-05T11:00:00.000Z',
      watchlist: [{ id: 1, media_type: 'movie', title: 'Updated', addedAt: 30 } as LibrarySnapshot['watchlist'][number]],
      favorites: [{ id: 3, media_type: 'movie', favoritedAt: 40 } as LibrarySnapshot['favorites'][number]],
      ratings: [{ id: 2, media_type: 'tv', rating: 9, ratedAt: 50 }],
    }

    const merged = mergeLibrarySnapshots(base, remote)

    expect(merged.watchlist[0].title).toBe('Updated')
    expect(merged.favorites).toHaveLength(1)
    expect(merged.ratings[0].rating).toBe(9)
    expect(merged.exportedAt).toBe('2026-09-05T11:00:00.000Z')
  })

  it('does not mutate either source snapshot', () => {
    const local = structuredClone(base)
    const remote = structuredClone(base)

    mergeLibrarySnapshots(local, remote)

    expect(local).toEqual(base)
    expect(remote).toEqual(base)
  })
})
