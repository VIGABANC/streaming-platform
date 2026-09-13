import { createEmptyLibrarySnapshot, mergeLibrarySnapshots, normalizeLibrarySnapshot, type LibrarySnapshot } from './types'

export const LIBRARY_OWNER_KEY = 'veyra-library-owner'
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const snapshotKey = (owner: string | null) => `veyra-library-saved:${owner ?? 'anonymous'}`
export const baselineKey = (owner: string) => `veyra-library-baseline:${owner}`

export function storedSnapshot(storage: StoragePort, key: string): LibrarySnapshot | null {
  try { return normalizeLibrarySnapshot(JSON.parse(storage.getItem(key) ?? 'null')) } catch { return null }
}

/** Save before switching; never discard unsynced data on sign-out or account change. */
export function switchLibraryOwner(storage: StoragePort, next: string | null, current: LibrarySnapshot): LibrarySnapshot {
  const previous = storage.getItem(LIBRARY_OWNER_KEY)
  if (previous === next) return current
  storage.setItem(snapshotKey(previous), JSON.stringify(current))
  const saved = storedSnapshot(storage, snapshotKey(next)) ?? createEmptyLibrarySnapshot()
  // Anonymous additions are merged only on an explicit anonymous -> account transition.
  const result = next && !previous ? mergeLibrarySnapshots(current, saved) : saved
  if (next) storage.setItem(LIBRARY_OWNER_KEY, next)
  else storage.removeItem(LIBRARY_OWNER_KEY)
  return result
}
