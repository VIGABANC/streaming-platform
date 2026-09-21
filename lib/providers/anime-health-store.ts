import 'server-only'

export interface ProviderHealthEntry {
  providerId: string
  successCount: number
  failureCount: number
  totalLatencyMs: number
  lastSuccessAt: number | null
  lastFailureAt: number | null
  lastError: string | null
}

const WINDOW_MS = 24 * 60 * 60 * 1000
const entries = new Map<string, ProviderHealthEntry>()
const timestamps = new Map<string, Array<{ at: number; success: boolean; latencyMs?: number; error?: string }>>()

function prune(providerId: string) {
  const now = Date.now()
  const recent = (timestamps.get(providerId) ?? []).filter((event) => now - event.at <= WINDOW_MS)
  timestamps.set(providerId, recent)
  const entry = entries.get(providerId) ?? { providerId, successCount: 0, failureCount: 0, totalLatencyMs: 0, lastSuccessAt: null, lastFailureAt: null, lastError: null }
  entry.successCount = recent.filter((event) => event.success).length
  entry.failureCount = recent.filter((event) => !event.success).length
  entry.totalLatencyMs = recent.reduce((total, event) => total + (event.latencyMs ?? 0), 0)
  entries.set(providerId, entry)
}

export function recordSuccess(providerId: string, latencyMs: number): void {
  const now = Date.now()
  const event = { at: now, success: true, latencyMs }
  timestamps.set(providerId, [...(timestamps.get(providerId) ?? []), event])
  const entry = entries.get(providerId) ?? { providerId, successCount: 0, failureCount: 0, totalLatencyMs: 0, lastSuccessAt: null, lastFailureAt: null, lastError: null }
  entry.lastSuccessAt = now
  entry.lastError = null
  entries.set(providerId, entry)
  prune(providerId)
}

export function recordFailure(providerId: string, error: string): void {
  const now = Date.now()
  timestamps.set(providerId, [...(timestamps.get(providerId) ?? []), { at: now, success: false, error }])
  const entry = entries.get(providerId) ?? { providerId, successCount: 0, failureCount: 0, totalLatencyMs: 0, lastSuccessAt: null, lastFailureAt: null, lastError: null }
  entry.lastFailureAt = now
  entry.lastError = error
  entries.set(providerId, entry)
  prune(providerId)
}

export function getProviderHealth(providerId: string): ProviderHealthEntry {
  prune(providerId)
  return { ...(entries.get(providerId) ?? { providerId, successCount: 0, failureCount: 0, totalLatencyMs: 0, lastSuccessAt: null, lastFailureAt: null, lastError: null }) }
}

export function getRankedProviders(providerIds?: string[]): string[] {
  const ids = providerIds ?? [...entries.keys()]
  return [...ids].sort((a, b) => {
    const left = getProviderHealth(a)
    const right = getProviderHealth(b)
    const leftAttempts = left.successCount + left.failureCount
    const rightAttempts = right.successCount + right.failureCount
    const leftRate = leftAttempts ? left.successCount / leftAttempts : 0
    const rightRate = rightAttempts ? right.successCount / rightAttempts : 0
    const leftDeprioritized = leftAttempts >= 10 && leftRate < 0.5
    const rightDeprioritized = rightAttempts >= 10 && rightRate < 0.5
    if (leftDeprioritized !== rightDeprioritized) return leftDeprioritized ? 1 : -1
    if (leftRate !== rightRate) return rightRate - leftRate
    return (left.totalLatencyMs / Math.max(1, left.successCount)) - (right.totalLatencyMs / Math.max(1, right.successCount))
  })
}

export function resetProviderHealth(): void {
  entries.clear()
  timestamps.clear()
}
