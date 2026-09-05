import { beforeEach, describe, expect, it } from 'vitest'
import { store } from '@/lib/store'
import { parseLibraryBackup, BACKUP_SCHEMA_VERSION } from '@/lib/library/backup-schema'

const storage: Record<string, string> = {}

global.localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach((key) => delete storage[key]) },
  key: () => null,
  length: 0,
}

const validBackup = {
  schemaVersion: BACKUP_SCHEMA_VERSION,
  exportedAt: '2026-09-05T12:00:00.000Z',
  watchlist: [{ id: 550, title: 'Fight Club', media_type: 'movie', addedAt: 1 }],
  favorites: [],
  ratings: [],
  history: [],
  continueWatching: [],
  profile: { name: 'Night Signal', avatar: 'signal-red', bio: '', joinedAt: 1 },
  settings: { autoplayNext: true, defaultServer: 'vidsrc-wiki', streamQuality: 'auto', ambientLighting: true, reducedMotion: false },
}

describe('library backup validation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('accepts a complete versioned backup', () => {
    const result = parseLibraryBackup(JSON.stringify(validBackup))

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.snapshot.watchlist[0].id).toBe(550)
  })

  it('rejects malformed items and future versions', () => {
    const malformed = { ...validBackup, watchlist: [{ id: '550', media_type: 'movie' }] }
    const future = { ...validBackup, schemaVersion: BACKUP_SCHEMA_VERSION + 1 }

    expect(parseLibraryBackup(JSON.stringify(malformed))).toMatchObject({ ok: false, reason: 'invalid-schema' })
    expect(parseLibraryBackup(JSON.stringify(future))).toMatchObject({ ok: false, reason: 'unsupported-version' })
  })

  it('rejects hostile oversized or script-breaking payloads without accepting it as data', () => {
    const hostile = { ...validBackup, profile: { ...validBackup.profile, bio: '</script><script>alert(1)</script>' } }
    const oversized = { ...validBackup, watchlist: Array.from({ length: 101 }, (_, id) => ({ id: id + 1, media_type: 'movie', addedAt: 1 })) }

    expect(parseLibraryBackup(JSON.stringify(hostile))).toMatchObject({ ok: true })
    expect(parseLibraryBackup(JSON.stringify(oversized))).toMatchObject({ ok: false, reason: 'too-large' })
    expect(parseLibraryBackup(JSON.stringify({ ...validBackup, favorites: Array.from({ length: 101 }, (_, id) => ({ id: id + 1, media_type: 'movie', addedAt: 1, favoritedAt: 1 })) }))).toMatchObject({ ok: false, reason: 'too-large' })
  })

  it('does not mutate storage when an import is rejected', () => {
    store.addToWatchlist({ id: 1, media_type: 'movie', title: 'Keep', addedAt: 1 })
    const before = store.getWatchlist()

    const result = store.importData(JSON.stringify({ ...validBackup, watchlist: [{ id: -1, media_type: 'movie', addedAt: 1 }] }))

    expect(result).toMatchObject({ ok: false })
    expect(store.getWatchlist()).toEqual(before)
  })
})
