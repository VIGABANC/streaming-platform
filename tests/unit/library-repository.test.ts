import { beforeEach, describe, expect, it } from 'vitest'
import { store } from '@/lib/store'
import { createEmptyLibrarySnapshot } from '@/lib/library/types'
import { clearLocalLibrary, LIBRARY_OWNER_KEY, readLocalLibrary, writeLocalLibrary } from '@/lib/library/local-repository'

const storage: Record<string, string> = {}
global.localStorage = {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value },
  removeItem: (key: string) => { delete storage[key] },
  clear: () => { Object.keys(storage).forEach((key) => delete storage[key]) },
  key: () => null,
  length: 0,
}

describe('local library repository', () => {
  beforeEach(() => {
    localStorage.clear()
    store.clearAll()
  })

  it('round-trips the internal snapshot through the versioned backup format', () => {
    const snapshot = createEmptyLibrarySnapshot()
    snapshot.watchlist.push({ id: 550, media_type: 'movie', title: 'Fight Club', addedAt: 1 })

    writeLocalLibrary(snapshot)

    expect(readLocalLibrary().watchlist).toEqual(snapshot.watchlist)
  })

  it('clears the account owner marker with cached account data', () => {
    localStorage.setItem(LIBRARY_OWNER_KEY, 'user-a')

    clearLocalLibrary()

    expect(localStorage.getItem(LIBRARY_OWNER_KEY)).toBeNull()
  })
})
