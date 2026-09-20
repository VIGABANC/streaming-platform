// ─────────────────────────────────────────────────────────────────────────────
// Provider Health — server-side DNS + reachability checks for embed providers.
// server-only: never import this from a client component.
// ─────────────────────────────────────────────────────────────────────────────

import 'server-only'
import { lookup } from 'node:dns/promises'
import { PROVIDERS, type StreamProvider } from './player'

export type ProviderHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'dns-failure'
  | 'unreachable'
  | 'timeout'
  | 'rate-limited'
  | 'unverified'

export type ProviderErrorCode =
  | 'NO_PROVIDER_CONFIGURED'
  | 'PROVIDER_DNS_FAILURE'
  | 'PROVIDER_UNREACHABLE'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_BLOCKED_BY_CSP'
  | 'MEDIA_ID_INVALID'
  | 'MEDIA_NOT_ON_THIS_PROVIDER'

export interface ProviderHealthResult {
  id: string
  name: string
  origin: string
  dnsResolved: boolean
  resolvedIp: string | null
  reachable: boolean
  status: ProviderHealthStatus
  latencyMs: number | null
  lastCheckedAt: string
  error: ProviderErrorCode | null
}

const CACHE_TTL_MS = 60_000
let cache: { results: ProviderHealthResult[]; expiresAt: number } | null = null

function generateRequestId(): string {
  return `ph_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

async function checkDns(origin: string): Promise<{ resolved: boolean; ip: string | null }> {
  let hostname: string
  try {
    hostname = new URL(origin).hostname
  } catch {
    return { resolved: false, ip: null }
  }
  try {
    const addresses = await lookup(hostname, { all: true })
    if (addresses.length > 0) {
      return { resolved: true, ip: addresses[0].address }
    }
    return { resolved: false, ip: null }
  } catch {
    return { resolved: false, ip: null }
  }
}

async function checkReachability(origin: string, signal: AbortSignal): Promise<{ reachable: boolean; latencyMs: number; status: ProviderHealthStatus; error: ProviderErrorCode | null }> {
  const start = performance.now()
  try {
    const response = await fetch(origin, {
      method: 'HEAD',
      signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'VEYRA-HealthCheck/1.0' },
    })
    const latencyMs = Math.round(performance.now() - start)
    if (response.status === 429) {
      return { reachable: false, latencyMs, status: 'rate-limited', error: 'PROVIDER_RATE_LIMITED' }
    }
    // Any HTTP response means the server is reachable
    return { reachable: true, latencyMs, status: latencyMs > 3000 ? 'degraded' : 'healthy', error: null }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start)
    if (error instanceof Error && error.name === 'AbortError') {
      return { reachable: false, latencyMs, status: 'timeout', error: 'PROVIDER_TIMEOUT' }
    }
    return { reachable: false, latencyMs, status: 'unreachable', error: 'PROVIDER_UNREACHABLE' }
  }
}

async function checkProvider(provider: StreamProvider): Promise<ProviderHealthResult> {
  const now = new Date().toISOString()

  const { resolved, ip } = await checkDns(provider.origin)
  if (!resolved) {
    return {
      id: provider.id,
      name: provider.name,
      origin: provider.origin,
      dnsResolved: false,
      resolvedIp: null,
      reachable: false,
      status: 'dns-failure',
      latencyMs: null,
      lastCheckedAt: now,
      error: 'PROVIDER_DNS_FAILURE',
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    const reachability = await checkReachability(provider.origin, controller.signal)
    return {
      id: provider.id,
      name: provider.name,
      origin: provider.origin,
      dnsResolved: true,
      resolvedIp: ip,
      reachable: reachability.reachable,
      status: reachability.status,
      latencyMs: reachability.latencyMs,
      lastCheckedAt: now,
      error: reachability.error,
    }
  } finally {
    clearTimeout(timeout)
  }
}

export async function getProviderHealth(force = false): Promise<ProviderHealthResult[]> {
  if (!force && cache && Date.now() < cache.expiresAt) {
    return cache.results
  }

  const requestId = generateRequestId()
  const results = await Promise.all(PROVIDERS.map((provider) => checkProvider(provider)))

  // Log results with request ID for observability
  for (const result of results) {
    console.log(`[provider-health] ${requestId} ${result.id} origin=${result.origin} dns=${result.dnsResolved} ip=${result.resolvedIp ?? 'N/A'} reachable=${result.reachable} status=${result.status} latency=${result.latencyMs ?? 'N/A'}ms error=${result.error ?? 'none'}`)
  }

  cache = { results, expiresAt: Date.now() + CACHE_TTL_MS }
  return results
}

export function isProviderHealthy(result: ProviderHealthResult): boolean {
  return result.status === 'healthy' || result.status === 'degraded'
}

export function isProviderUsable(result: ProviderHealthResult): boolean {
  return result.dnsResolved && result.status !== 'dns-failure'
}

/**
 * Returns the list of provider IDs that passed DNS resolution.
 * Used by watch routes to exclude dead providers before rendering.
 */
export async function getHealthyProviderIds(): Promise<Set<string>> {
  const health = await getProviderHealth()
  return new Set(health.filter(isProviderUsable).map((r) => r.id))
}

/**
 * Returns health results suitable for client-side consumption.
 * Strips resolved IPs for security.
 */
export async function getProviderHealthForClient(): Promise<Omit<ProviderHealthResult, 'resolvedIp'>[]> {
  const results = await getProviderHealth()
  return results.map(({ resolvedIp: _resolvedIp, ...rest }) => rest)
}
