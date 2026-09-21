import 'server-only'
import type { EmbedProviderConfig } from './embed-registry'

export type EmbedCheckReason = 'empty-response' | 'no-sources' | 'timeout' | 'network-error' | `HTTP ${number}`
export type EmbedCheckResult = { status: 'success' | 'failure'; reason?: EmbedCheckReason; provider: string; latencyMs: number; bytes?: number }

const CACHE_TTL_MS = 5 * 60_000
const cache = new Map<string, { result: EmbedCheckResult; expiresAt: number }>()

export function buildEmbedHealthKey(providerId: string, mediaType: string, mediaId: string | number, season?: number, episode?: number) {
  return [providerId, mediaType, mediaId, season ?? '', episode ?? ''].join(':')
}

export async function checkEmbedProvider(
  provider: EmbedProviderConfig & { url?: string },
  mediaType: 'movie' | 'tv' | 'anime',
  mediaId: string | number,
  season?: number,
  episode?: number,
): Promise<EmbedCheckResult> {
  if (!provider.url) return { status: 'failure', reason: 'network-error', provider: provider.id, latencyMs: 0 }
  const key = buildEmbedHealthKey(provider.id, mediaType, mediaId, season, episode)
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.result
  const started = performance.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8_000)
  let result: EmbedCheckResult
  try {
    const response = await fetch(provider.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VEYRA/1.0)' }, signal: controller.signal, cache: 'no-store' })
    const latencyMs = Math.round(performance.now() - started)
    if (!response.ok) result = { status: 'failure', reason: `HTTP ${response.status}`, provider: provider.id, latencyMs }
    else {
      const body = await response.text()
      result = body.length < 500
        ? { status: 'failure', reason: 'empty-response', provider: provider.id, latencyMs, bytes: body.length }
        : /not\s*found|no\s*sources?|unavailable/i.test(body) && body.length < 5000
          ? { status: 'failure', reason: 'no-sources', provider: provider.id, latencyMs, bytes: body.length }
          : { status: 'success', provider: provider.id, latencyMs, bytes: body.length }
    }
  } catch (error) {
    result = { status: 'failure', reason: error instanceof Error && error.name === 'AbortError' ? 'timeout' : 'network-error', provider: provider.id, latencyMs: Math.round(performance.now() - started) }
  } finally { clearTimeout(timeout) }
  cache.set(key, { result, expiresAt: Date.now() + CACHE_TTL_MS })
  console.log(`[embed-health] ${provider.id} ${result.status} reason=${result.reason ?? 'none'} latency=${result.latencyMs}ms`)
  return result
}

export function clearEmbedHealthCache() { cache.clear() }
