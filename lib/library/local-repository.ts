import { store } from '@/lib/store'
import { createEmptyLibrarySnapshot, normalizeLibrarySnapshot, type LibrarySnapshot } from './types'

export const LIBRARY_OWNER_KEY = 'veyra-library-owner'

export function readLocalLibrary(): LibrarySnapshot {
  const parsed = normalizeLibrarySnapshot(JSON.parse(store.exportData()))
  return parsed ?? createEmptyLibrarySnapshot()
}

export function writeLocalLibrary(snapshot: LibrarySnapshot): void {
  store.importData(JSON.stringify(snapshot))
}

export function clearLocalLibrary(): void {
  store.clearAll()
}
