import { describe, expect, it } from 'vitest'
import { createEmptyLibrarySnapshot, mergeLibrarySnapshots } from '@/lib/library/types'
import { switchLibraryOwner } from '@/lib/library/session'

function memory() {
  const data = new Map<string, string>()
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v) }, removeItem: (k: string) => { data.delete(k) } }
}
const item = (id: number) => ({ id, title: `Title ${id}`, media_type: 'movie' as const, addedAt: id })

describe('library account isolation', () => {
  it('restores the anonymous library on sign-out and parks unsynced account edits', () => {
    const storage = memory()
    const anonymous = { ...createEmptyLibrarySnapshot(), watchlist: [item(1)] }
    const signedIn = switchLibraryOwner(storage, 'user-a', anonymous)
    expect(signedIn.watchlist.map(x => x.id)).toEqual([1])
    signedIn.watchlist.push(item(2))
    const signedOut = switchLibraryOwner(storage, null, signedIn)
    expect(signedOut.watchlist.map(x => x.id)).toEqual([1])
    expect(switchLibraryOwner(storage, 'user-a', signedOut).watchlist.map(x => x.id).sort()).toEqual([1, 2])
  })
  it('does not merge one account into another', () => {
    const storage = memory()
    switchLibraryOwner(storage, 'a', createEmptyLibrarySnapshot())
    const a = { ...createEmptyLibrarySnapshot(), favorites: [{ ...item(2), favoritedAt: 2 }] }
    expect(switchLibraryOwner(storage, 'b', a).favorites).toEqual([])
    expect(switchLibraryOwner(storage, 'a', createEmptyLibrarySnapshot()).favorites[0].id).toBe(2)
  })
})

describe('three-way library reconciliation', () => {
  it('preserves local deletions and remote additions for all collections', () => {
    const base = { ...createEmptyLibrarySnapshot(), watchlist: [item(1)], favorites: [{ ...item(1), favoritedAt: 1 }], history: [{ ...item(1), watchedAt: 1 }] }
    const local = { ...base, watchlist: [], favorites: [], history: [] }
    const remote = { ...base, watchlist: [item(1), item(2)] }
    const merged = mergeLibrarySnapshots(local, remote, base)
    expect(merged.watchlist.map(x => x.id)).toEqual([2])
    expect(merged.favorites).toEqual([])
    expect(merged.history).toEqual([])
  })
  it('does not resurrect remote removals when the local snapshot is unchanged', () => {
    const base = { ...createEmptyLibrarySnapshot(), watchlist: [item(1)] }
    expect(mergeLibrarySnapshots(base, createEmptyLibrarySnapshot(), base).watchlist).toEqual([])
  })
})
