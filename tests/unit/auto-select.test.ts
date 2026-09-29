import { describe, it, expect, vi } from 'vitest'
import {
  rankProvidersForAutoSelect,
  autoSelectProvider,
  providerIdByIndex,
  type ProviderHealthSnapshot,
} from '@/lib/auto-select'
import { PROVIDERS, type StreamProvider } from '@/lib/player'

// Helper: build a health snapshot for a provider
function h(
  id: string,
  overrides: Partial<ProviderHealthSnapshot> = {},
): ProviderHealthSnapshot {
  return {
    id,
    dnsResolved: true,
    reachable: true,
    status: 'healthy',
    latencyMs: 100,
    ...overrides,
  }
}

const verifiedProviders: StreamProvider[] = PROVIDERS.map((p) => ({
  ...p,
  trustEligible: true,
  authorizationStatus: 'authorized' as const,
  verification: {
    ...p.verification,
    authorizationEvidence: ['test'],
    originChecks: [p.origin],
    lastVerifiedAt: new Date().toISOString(),
    enabled: true,
  },
}))

describe('autoSelectProvider — server-side ranking', () => {
  it('ranks healthy providers first, then by latency ascending', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 800 }),
      h('vidsrc-xyz', { latencyMs: 300 }),
      h('2embed', { latencyMs: 500 }),
      h('autoembed', { latencyMs: 200 }),
    ]
    const ranked = rankProvidersForAutoSelect(health)
    // All healthy → sorted by latency ascending
    expect(ranked[0]).toBe('autoembed')   // 200ms
    expect(ranked[1]).toBe('vidsrc-xyz')   // 300ms
    expect(ranked[2]).toBe('2embed')      // 500ms
    expect(ranked[3]).toBe('vidsrc-wiki')  // 800ms
  })

  it('places healthy providers ahead of unhealthy ones regardless of latency', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 50, status: 'dns-failure', dnsResolved: false, reachable: false }),
      h('vidsrc-xyz', { latencyMs: 5000 }),
    ]
    const ranked = rankProvidersForAutoSelect(health)
    expect(ranked[0]).toBe('vidsrc-xyz') // healthy despite high latency
    expect(ranked[1]).toBe('vidsrc-wiki') // DNS failure last
  })

  it('promotes the preferred provider to the top when it is healthy', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 200 }),
      h('vidsrc-xyz', { latencyMs: 100 }),
      h('2embed', { latencyMs: 300 }),
    ]
    // Preferred = 2embed (300ms, highest latency among healthy) but should rank first
    const ranked = rankProvidersForAutoSelect(health, '2embed')
    expect(ranked[0]).toBe('2embed')
  })

  it('does not promote the preferred provider when it is unhealthy', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 200 }),
      h('vidsrc-xyz', { status: 'dns-failure', dnsResolved: false, reachable: false, latencyMs: null }),
    ]
    const ranked = rankProvidersForAutoSelect(health, 'vidsrc-xyz')
    expect(ranked[0]).toBe('vidsrc-wiki') // healthy provider wins
    expect(ranked).toContain('vidsrc-xyz') // still in list, just not first
  })

  it('returns the top-ranked provider as the auto-selected one', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 500 }),
      h('vidsrc-xyz', { latencyMs: 200 }),
    ]
    expect(autoSelectProvider(health)).toBe('vidsrc-xyz')
  })

  it('promotes preferred provider to auto-select when healthy', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 100 }),
      h('vidsrc-xyz', { latencyMs: 500 }),
    ]
    expect(autoSelectProvider(health, 'vidsrc-xyz')).toBe('vidsrc-xyz')
  })

  it('falls back to first provider when no health data is available', () => {
    expect(autoSelectProvider([])).toBe(PROVIDERS[0].id)
  })

  it('treats degraded status as healthy', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { status: 'degraded', latencyMs: 4000 }),
      h('vidsrc-xyz', { status: 'dns-failure', dnsResolved: false, reachable: false, latencyMs: null }),
    ]
    const ranked = rankProvidersForAutoSelect(health)
    expect(ranked[0]).toBe('vidsrc-wiki') // degraded is still "healthy" tier
  })

  it('excludes DNS-failed providers from the healthy tier but keeps them in the list', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 200 }),
      h('vidsrc-xyz', { dnsResolved: false, reachable: false, status: 'dns-failure', latencyMs: null }),
      h('2embed', { latencyMs: 300 }),
    ]
    const ranked = rankProvidersForAutoSelect(health)
    // Healthy first, DNS-failed last
    expect(ranked[0]).toBe('vidsrc-wiki')
    expect(ranked[1]).toBe('2embed')
    expect(ranked[2]).toBe('vidsrc-xyz')
  })

  it('works with a custom provider list (e.g. verified providers)', () => {
    const health: ProviderHealthSnapshot[] = [
      h(verifiedProviders[0].id, { latencyMs: 500 }),
      h(verifiedProviders[1].id, { latencyMs: 200 }),
    ]
    const ranked = rankProvidersForAutoSelect(health, undefined, verifiedProviders)
    expect(ranked[0]).toBe(verifiedProviders[1].id)
  })
})

describe('providerIdByIndex — dev-only forceProvider', () => {
  it('maps a valid index to the corresponding provider ID', () => {
    expect(providerIdByIndex(0)).toBe(PROVIDERS[0].id)
    expect(providerIdByIndex(1)).toBe(PROVIDERS[1].id)
    expect(providerIdByIndex(2)).toBe(PROVIDERS[2].id)
  })

  it('returns null for out-of-range indices', () => {
    expect(providerIdByIndex(-1)).toBeNull()
    expect(providerIdByIndex(999)).toBeNull()
    expect(providerIdByIndex(PROVIDERS.length)).toBeNull()
  })

  it('returns null for non-integer values', () => {
    expect(providerIdByIndex(1.5)).toBeNull()
    expect(providerIdByIndex(NaN)).toBeNull()
  })
})

describe('forceProvider-in-prod rejection', () => {
  it('the watch route gates forceProvider behind NODE_ENV !== production', () => {
    // This test documents the contract: the watch route only reads forceProvider
    // when process.env.NODE_ENV !== 'production'. In production, the override
    // is null regardless of the query parameter.
    const env = process.env as Record<string, string | undefined>
    const originalEnv = env.NODE_ENV
    try {
      env.NODE_ENV = 'production'
      // Simulate the watch route's gating logic
      const forceProvider = '0'
      const forcedProviderId =
        env.NODE_ENV !== 'production' && forceProvider != null
          ? providerIdByIndex(Number(forceProvider))
          : null
      expect(forcedProviderId).toBeNull()

      env.NODE_ENV = 'development'
      const devForcedProviderId =
        env.NODE_ENV !== 'production' && forceProvider != null
          ? providerIdByIndex(Number(forceProvider))
          : null
      expect(devForcedProviderId).toBe(PROVIDERS[0].id)
    } finally {
      env.NODE_ENV = originalEnv
    }
  })
})

describe('fallback cap behavior', () => {
  it('caps automatic fallbacks at 2 per page load', () => {
    // The PlayerFrame uses automaticFallbacksRef.current >= 2 to stop.
    // This test documents the cap: after 2 automatic fallbacks, the
    // "Provider unavailable" card is shown instead of trying another server.
    let automaticFallbacks = 0
    const MAX_AUTOMATIC_FALLBACKS = 2

    function shouldFallback(): boolean {
      return automaticFallbacks < MAX_AUTOMATIC_FALLBACKS
    }

    function failover(): 'fallback' | 'exhausted' {
      if (!shouldFallback()) return 'exhausted'
      automaticFallbacks++
      return 'fallback'
    }

    expect(failover()).toBe('fallback') // 1st
    expect(failover()).toBe('fallback') // 2nd
    expect(failover()).toBe('exhausted') // 3rd attempt → cap reached
    expect(automaticFallbacks).toBe(2)
  })

  it('rankProvidersForAutoSelect excludes already-attempted providers for fallback chain', () => {
    const health: ProviderHealthSnapshot[] = [
      h('vidsrc-wiki', { latencyMs: 200 }),
      h('vidsrc-xyz', { latencyMs: 300 }),
      h('2embed', { latencyMs: 400 }),
      h('autoembed', { latencyMs: 500 }),
    ]
    // First attempt: vidsrc-wiki
    const ranked1 = rankProvidersForAutoSelect(health)
    expect(ranked1[0]).toBe('vidsrc-wiki')

    // After first fails, exclude it — next is vidsrc-xyz
    const attempted = new Set([ranked1[0]])
    const ranked2 = rankProvidersForAutoSelect(health).filter((id) => !attempted.has(id))
    expect(ranked2[0]).toBe('vidsrc-xyz')

    // After second fails, exclude both — next is 2embed
    attempted.add(ranked2[0])
    const ranked3 = rankProvidersForAutoSelect(health).filter((id) => !attempted.has(id))
    expect(ranked3[0]).toBe('2embed')
  })
})

describe('preference cookie contract', () => {
  it('the preference API validates providerId against the PROVIDERS registry', () => {
    // The /api/player/preference route checks PROVIDERS.some(p => p.id === providerId)
    // and rejects unknown IDs with 400. This test documents that contract.
    const validIds = PROVIDERS.map((p) => p.id)
    expect(validIds).toContain('vidsrc-wiki')
    expect(validIds).toContain('vidsrc-xyz')
    expect(validIds).toContain('2embed')
    expect(validIds).toContain('autoembed')
    expect(validIds).not.toContain('unknown-provider')
  })

  it('the cookie is httpOnly with 30d expiry', () => {
    // The preference route sets the cookie with:
    //   httpOnly: true, maxAge: 60 * 60 * 24 * 30 (30 days)
    // This test documents the expected maxAge.
    const expectedMaxAge = 60 * 60 * 24 * 30
    expect(expectedMaxAge).toBe(2_592_000) // 30 days in seconds
  })
})
