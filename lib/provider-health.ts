// ─────────────────────────────────────────────────────────────────────────────
// Provider Health — server-side DNS + reachability checks for embed providers.
// server-only: never import this from a client component.
// ─────────────────────────────────────────────────────────────────────────────

import 'server-only'
import { lookup } from 'node:dns/promises'
import { PROVIDERS, type StreamProvider } from './player'
import { getConsumetConfig } from './providers/consumet'
import { getConfiguredAnimeProviders, providerOrigin } from './providers/anime-registry'

export type ProviderHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'dns-failure'
  | 'unreachable'
  | 'timeout'
  | 'rate-limited'
  | 'unverified'
  | 'self-reference'
  | 'not-configured'

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

type OriginCheck = {
  dnsResolved: boolean
  resolvedIp: string | null
  reachable: boolean
  status: ProviderHealthStatus
  latencyMs: number | null
  error: ProviderErrorCode | null
}

/** DNS + reachability probe for one origin. */
async function checkOrigin(origin: string): Promise<OriginCheck> {
  const { resolved, ip } = await checkDns(origin)
  if (!resolved) {
    return { dnsResolved: false, resolvedIp: null, reachable: false, status: 'dns-failure', latencyMs: null, error: 'PROVIDER_DNS_FAILURE' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  try {
    const reachability = await checkReachability(origin, controller.signal)
    return { dnsResolved: true, resolvedIp: ip, ...reachability }
  } finally {
    clearTimeout(timeout)
  }
}

async function checkConsumetEndpoint(origin: string): Promise<OriginCheck> {
  const { resolved, ip } = await checkDns(origin)
  if (!resolved) {
    return { dnsResolved: false, resolvedIp: null, reachable: false, status: 'dns-failure', latencyMs: null, error: 'PROVIDER_DNS_FAILURE' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5_000)
  const start = performance.now()
  try {
    const response = await fetch(`${origin.replace(/\/$/, '')}/anime/gogoanime/top-airing`, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { Accept: 'application/json', 'User-Agent': 'VEYRA-HealthCheck/1.0' },
    })
    const latencyMs = Math.round(performance.now() - start)
    if (response.status === 429) return { dnsResolved: true, resolvedIp: ip, reachable: false, status: 'rate-limited', latencyMs, error: 'PROVIDER_RATE_LIMITED' }
    if (!response.ok) return { dnsResolved: true, resolvedIp: ip, reachable: false, status: 'unreachable', latencyMs, error: 'PROVIDER_UNREACHABLE' }
    const payload: unknown = await response.json()
    const validShape = Array.isArray(payload) || Boolean(payload && typeof payload === 'object' && Object.keys(payload).length > 0)
    if (!validShape) return { dnsResolved: true, resolvedIp: ip, reachable: false, status: 'unreachable', latencyMs, error: 'PROVIDER_UNREACHABLE' }
    return { dnsResolved: true, resolvedIp: ip, reachable: true, status: latencyMs > 3000 ? 'degraded' : 'healthy', latencyMs, error: null }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start)
    if (error instanceof Error && error.name === 'AbortError') return { dnsResolved: true, resolvedIp: ip, reachable: false, status: 'timeout', latencyMs, error: 'PROVIDER_TIMEOUT' }
    return { dnsResolved: true, resolvedIp: ip, reachable: false, status: 'unreachable', latencyMs, error: 'PROVIDER_UNREACHABLE' }
  } finally {
    clearTimeout(timeout)
  }
}

async function checkProvider(provider: StreamProvider): Promise<ProviderHealthResult> {
  const now = new Date().toISOString()
  const check = await checkOrigin(provider.origin)
  return {
    id: provider.id,
    name: provider.name,
    origin: provider.origin,
    ...check,
    lastCheckedAt: now,
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
export async function getProviderHealthForClient(force = false): Promise<Omit<ProviderHealthResult, 'resolvedIp'>[]> {
  const results = await getProviderHealth(force)
  return results.map(({ resolvedIp: _resolvedIp, ...rest }) => rest)
}

// ── Configured anime provider health ──────────────────────────────────────────

export async function getAnimeProviderHealthForClient(force = false): Promise<Array<Omit<ProviderHealthResult, 'resolvedIp'>>> {
  // Anime adapters share the same operator-configured origin when they use
  // Consumet. Empty origins are intentionally omitted and never probed.
  const providers = getConfiguredAnimeProviders()
  const results = await Promise.all(providers.map(async (provider) => {
    const origin = providerOrigin(provider)
    if (!origin) return {
      id: provider.id, name: provider.name, origin: '', dnsResolved: false,
      resolvedIp: null, reachable: false, status: 'unverified' as const, latencyMs: null,
      lastCheckedAt: new Date().toISOString(), error: null,
    }
    const check = await checkOrigin(origin)
    return { id: provider.id, name: provider.name, origin, ...check, lastCheckedAt: new Date().toISOString() }
  }))
  void force
  return results.map(({ resolvedIp: _resolvedIp, ...result }) => result)
}

// ── Consumet (self-hosted anime provider) ─────────────────────────────────────

export interface ConsumetHealthResult {
  /** False when CONSUMET_BASE_URL is unset — nothing is probed in that case. */
  configured: boolean
  id: string
  name: string
  origin: string | null
  dnsResolved: boolean
  resolvedIp: string | null
  reachable: boolean
  status: ProviderHealthStatus | null
  latencyMs: number | null
  lastCheckedAt: string
  error: ProviderErrorCode | null
}

const CONSUMET_HEALTH_NAME = 'Consumet (self-hosted)'
let consumetCache: { result: ConsumetHealthResult; expiresAt: number; appOrigin: string | null } | null = null

export async function getConsumetHealth(force = false, requestOrigin?: string): Promise<ConsumetHealthResult> {
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || requestOrigin || null
  if (!force && consumetCache && Date.now() < consumetCache.expiresAt && consumetCache.appOrigin === appOrigin) {
    return consumetCache.result
  }
  if (!force && consumetCache && Date.now() < consumetCache.expiresAt) {
    return consumetCache.result
  }

  const config = getConsumetConfig()
  const lastCheckedAt = new Date().toISOString()
  let result: ConsumetHealthResult

  if (!config) {
    // Unset base URL: report the unconfigured state, never probe.
    result = {
      configured: false,
      id: 'consumet',
      name: CONSUMET_HEALTH_NAME,
      origin: null,
      dnsResolved: false,
      resolvedIp: null,
      reachable: false,
      status: 'not-configured',
      latencyMs: null,
      lastCheckedAt,
      error: null,
    }
  } else {
    let check: OriginCheck
    let selfReference = false
    try {
      selfReference = Boolean(appOrigin && new URL(config.baseUrl).origin === new URL(appOrigin).origin)
    } catch {
      selfReference = false
    }
    if (selfReference) {
      console.warn(`[provider-health] ${generateRequestId()} CONSUMET_BASE_URL points at the app's own origin — refusing to probe. Configure a real Consumet instance.`)
      check = { dnsResolved: false, resolvedIp: null, reachable: false, status: 'self-reference', latencyMs: null, error: 'PROVIDER_UNREACHABLE' }
    } else {
      check = await checkConsumetEndpoint(config.baseUrl)
    }
    result = {
      configured: true,
      id: 'consumet',
      name: CONSUMET_HEALTH_NAME,
      origin: config.baseUrl,
      dnsResolved: check.dnsResolved,
      resolvedIp: check.resolvedIp,
      reachable: check.reachable,
      status: check.status,
      latencyMs: check.latencyMs,
      lastCheckedAt,
      error: check.error,
    }
    console.log(`[provider-health] consumet origin=${config.baseUrl} dns=${check.dnsResolved} reachable=${check.reachable} status=${check.status} latency=${check.latencyMs ?? 'N/A'}ms`)
  }

  consumetCache = { result, expiresAt: Date.now() + CACHE_TTL_MS, appOrigin }
  return result
}

export async function getConsumetHealthForClient(force = false, requestOrigin?: string): Promise<Omit<ConsumetHealthResult, 'resolvedIp'>> {
  const { resolvedIp: _resolvedIp, ...rest } = await getConsumetHealth(force, requestOrigin)
  return rest
}
