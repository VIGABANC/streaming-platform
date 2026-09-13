import { describe, expect, it } from 'vitest'
import { syncLibraryOnce } from '@/lib/library/sync'
import { createEmptyLibrarySnapshot } from '@/lib/library/types'

describe('library sync races', () => {
  it('does not restore an account response after sign-out', async () => {
    let active = true
    let writes = 0
    const result = await syncLibraryOnce({
      isCurrent: () => active,
      readLocal: createEmptyLibrarySnapshot,
      readRemote: async () => { active = false; return { snapshot: createEmptyLibrarySnapshot(), revision: '1' } },
      writeRemote: async () => { writes++; return true },
      apply: () => { writes++ },
    })
    expect(result).toBe('cancelled')
    expect(writes).toBe(0)
  })
  it('preserves local edits made while an upload is pending', async () => {
    let local = createEmptyLibrarySnapshot()
    const result = await syncLibraryOnce({
      isCurrent: () => true, readLocal: () => local,
      readRemote: async () => ({ snapshot: null, revision: null }),
      writeRemote: async () => { local = { ...local, history: [{ id: 1, title: 'New history', media_type: 'movie', watchedAt: 10 }] }; return true },
      apply: next => { local = next },
    })
    expect(result).toBe('changed')
    expect(local.history[0].title).toBe('New history')
  })
  it('retries concurrent remote changes without overwriting them', async () => {
    let attempts = 0
    const result = await syncLibraryOnce({
      isCurrent: () => true, readLocal: createEmptyLibrarySnapshot,
      readRemote: async () => ({ snapshot: null, revision: String(attempts) }),
      writeRemote: async () => { attempts++; return false },
      apply: () => { throw new Error('Must not apply an uncommitted snapshot') },
    })
    expect(result).toBe('conflict')
    expect(attempts).toBe(3)
  })
  it('does not upload identical library content on tab focus', async () => {
    const result = await syncLibraryOnce({
      isCurrent: () => true, readLocal: createEmptyLibrarySnapshot,
      readRemote: async () => ({ snapshot: createEmptyLibrarySnapshot(), revision: '1' }),
      writeRemote: async () => { throw new Error('No redundant upload') },
      apply: () => {},
    })
    expect(result).toBe('synced')
  })
})
