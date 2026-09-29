// ─────────────────────────────────────────────────────────────────────────────
// Server-side auto-selection — ranks providers for auto-load playback.
//
// Ranking priority (per spec):
//   1. Healthy (DNS resolved + reachable) first
//   2. Latency ascending
//   3. User's last-successful provider (preferred) as final tiebreaker
//
// "On next visit, if it's still healthy, rank it first" — the preferred
// provider gets a strong boost: if it is healthy it is placed at the top
// of the list, ahead of lower-latency alternatives. This is a deliberate
// trade-off: stickiness reduces jarring server switches across visits.
//
// This module is pure and side-effect-free so it can be unit-tested without
// mocking network or DNS. The caller supplies the health snapshot.
// ─────────────────────────────────────────────────────────────────────────────

import { PROVIDERS, DEFAULT_PROVIDER, type StreamProvider } from './player'

export interface ProviderHealthSnapshot {
  id: string
  dnsResolved: boolean
  reachable: boolean
  status: string
  latencyMs: number | null
}

function isHealthy(h: ProviderHealthSnapshot): boolean {
  return h.dnsResolved && h.reachable && (h.status === 'healthy' || h.status === 'degraded')
}

/**
 * Returns an ordered list of provider IDs ranked for auto-load.
 *
 * Healthy providers come first (sorted by latency ascending), then
 * DNS-resolved-but-unreachable providers, then everything else.
 * The preferred provider is promoted to the very top of the healthy tier
 * when it is itself healthy.
 */
export function rankProvidersForAutoSelect(
  health: ProviderHealthSnapshot[],
  preferredProviderId?: string,
  providers: StreamProvider[] = PROVIDERS,
): string[] {
  const healthMap = new Map(health.map((h) => [h.id, h]))

  return providers
    .map((provider) => {
      const h = healthMap.get(provider.id)
      const healthy = h ? isHealthy(h) : false
      const dnsResolved = h ? h.dnsResolved : false
      const latency = h?.latencyMs ?? Infinity
      const isPreferred = provider.id === preferredProviderId
      return { id: provider.id, healthy, dnsResolved, latency, isPreferred }
    })
    .sort((a, b) => {
      // Tier 1: healthy first
      if (a.healthy !== b.healthy) return a.healthy ? -1 : 1
      // Within the healthy tier, preferred provider goes to the very top
      if (a.healthy && b.healthy) {
        if (a.isPreferred && !b.isPreferred) return -1
        if (!a.isPreferred && b.isPreferred) return 1
      }
      // Tier 2: latency ascending
      if (a.latency !== b.latency) return a.latency - b.latency
      // Tier 3: DNS-resolved before unresolved
      if (a.dnsResolved !== b.dnsResolved) return a.dnsResolved ? -1 : 1
      return 0
    })
    .map((p) => p.id)
}

/**
 * Returns the single best provider ID for auto-load.
 * Falls back to DEFAULT_PROVIDER when no health data is available.
 */
export function autoSelectProvider(
  health: ProviderHealthSnapshot[],
  preferredProviderId?: string,
  providers: StreamProvider[] = PROVIDERS,
): string {
  const ranked = rankProvidersForAutoSelect(health, preferredProviderId, providers)
  return ranked[0] ?? DEFAULT_PROVIDER
}

/**
 * Dev-only override: maps a numeric index to a provider ID.
 * Returns null if the index is out of range.
 * In production this must never be called — the caller gates it.
 */
export function providerIdByIndex(index: number, providers: StreamProvider[] = PROVIDERS): string | null {
  if (!Number.isInteger(index) || index < 0 || index >= providers.length) return null
  return providers[index].id
}
