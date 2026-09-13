import { createEmptyLibrarySnapshot, mergeLibrarySnapshots, type LibrarySnapshot } from './types'
interface SyncPorts {
  isCurrent(): boolean
  readLocal(): LibrarySnapshot
  readRemote(): Promise<{ snapshot: LibrarySnapshot | null; revision: string | null }>
  writeRemote(snapshot: LibrarySnapshot, revision: string | null): Promise<boolean>
  apply(snapshot: LibrarySnapshot, baseline: LibrarySnapshot): void
  baseline?: LibrarySnapshot
}
const content = (s: LibrarySnapshot) => JSON.stringify({ ...s, exportedAt: '' })
export async function syncLibraryOnce(ports: SyncPorts): Promise<'synced' | 'changed' | 'conflict' | 'cancelled'> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const remote = await ports.readRemote()
    if (!ports.isCurrent()) return 'cancelled'
    const before = ports.readLocal()
    const merged = mergeLibrarySnapshots(before, remote.snapshot ?? createEmptyLibrarySnapshot(), ports.baseline)
    const unchanged = remote.snapshot && content(merged) === content(remote.snapshot)
    if (!unchanged && !await ports.writeRemote(merged, remote.revision)) continue
    if (!ports.isCurrent()) return 'cancelled'
    const after = ports.readLocal()
    const changed = content(before) !== content(after)
    const committed = unchanged ? remote.snapshot! : merged
    ports.apply(changed ? mergeLibrarySnapshots(after, committed, before) : committed, committed)
    return changed ? 'changed' : 'synced'
  }
  return 'conflict'
}
