import { describe, expect, it } from 'vitest'
import { emptyProviderHealth, rankProviders, PROVIDERS } from '@/lib/player'
import { resolvePlaybackSources } from '@/lib/playback-resolver'

describe('playback provider fallback ranking', () => {
  it('selects the next provider when the primary circuit is open', () => {
    const primary = PROVIDERS[0].id
    const ranked = rankProviders({ health: { [primary]: { ...emptyProviderHealth(primary), circuit: 'OPEN', cooldownUntil: Date.now() + 60_000 } } })
    expect(ranked[0].id).toBe('vidlink')
  })

  it('returns no sources when every provider was attempted', () => {
    const result = resolvePlaybackSources({ mediaType: 'movie', mediaId: 550, attemptedProviderIds: PROVIDERS.map((provider) => provider.id) })
    expect(result.sources).toEqual([])
    expect(result.status).toBe('unavailable')
  })

  it('demotes an embed pre-check failure without removing the provider', () => {
    const ranked = rankProviders({ health: { vidfast: { embedReachable: false } } })
    expect(ranked.map((provider) => provider.id)).toContain('vidfast')
    expect(ranked[0].id).toBe('vidlink')
  })

  it('auto-selects the fresh successful provider', () => {
    const ranked = rankProviders({ health: { vidlink: { attempts: 4, successes: 4, successEWMA: 1, startupLatencyEWMA: 100 } } })
    expect(ranked[0].id).toBe('vidlink')
  })
})
