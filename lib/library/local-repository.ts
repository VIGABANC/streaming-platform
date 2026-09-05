import { store } from '@/lib/store'
import { createEmptyLibrarySnapshot, normalizeLibrarySnapshot, type LibrarySnapshot } from './types'
import { serializeLibraryBackup } from './backup-schema'

export const LIBRARY_OWNER_KEY = 'veyra-library-owner'

export function readLocalLibrary(): LibrarySnapshot {
  const parsed = normalizeLibrarySnapshot(JSON.parse(store.exportData()))
  return parsed ?? createEmptyLibrarySnapshot()
}

export function writeLocalLibrary(snapshot: LibrarySnapshot): void {
  store.importData(serializeLibraryBackup(snapshot))
}

export function clearLocalLibrary(): void {
  store.clearAll()
  if (typeof localStorage !== 'undefined') localStorage.removeItem(LIBRARY_OWNER_KEY)
}
