import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  getMovieEmbedUrl,
  getTVEmbedUrl,
  isStrictPositiveInteger,
  rankProviders,
  getInitialProviderIdForMode,
  emptyProviderHealth,
  playerErrorMessage,
  PROVIDERS,
  isProviderEligible,
  isProviderAvailable,
  recordProviderFailure,
  recordProviderSuccess,
  type PlayerErrorCode,
  parseDocumentedProviderEvent,
} from '@/lib/player'
import {
  beginAttempt,
  exhaustAttempts,
  initialAttemptState,
  isCurrentAttempt,
  reloadAttempt,
  resumeOnline,
  setOffline,
  transitionAttempt,
} from '@/lib/player-attempt'
import { ExternalEmbedEngine, NativeMediaEngine } from '@/lib/player-engine'

const verifiedProviders = PROVIDERS.map((provider) => ({
  ...provider,
  trustEligible: true,
  authorizationStatus: 'authorized' as const,
  verification: {
    ...provider.verification,
    authorizationEvidence: ['test authorization record'],
    originChecks: [provider.origin],
    lastVerifiedAt: new Date().toISOString(),
    enabled: true,
  },
}))

describe('Player Architecture & URL Builders', () => {
  it('uses an explicit opaque external engine for registry-owned iframe playback', () => {
    expect(ExternalEmbedEngine.kind).toBe('external-embed')
    expect(ExternalEmbedEngine.ownsMediaControls).toBe(false)
    expect(ExternalEmbedEngine.canVerifyPlayback).toBe(false)
    expect(ExternalEmbedEngine.getSource({ mediaType: 'movie', mediaId: 603, providerId: 'vidfast' })).toContain('/movie/603')
  })

  it('keeps native playback gated behind an explicitly authorized direct source', () => {
    expect(NativeMediaEngine.kind).toBe('native-media')
    expect(NativeMediaEngine.ownsMediaControls).toBe(true)
    expect(NativeMediaEngine.canVerifyPlayback).toBe(true)
    expect(NativeMediaEngine.getSource({ mediaType: 'movie', mediaId: 603, providerId: 'native' })).toBeNull()
  })
  describe('getMovieEmbedUrl', () => {
    it('generates correct embed url for movie IDs', () => {
      const url = getMovieEmbedUrl(603)
      expect(url).toContain('/embed/603')
      expect(url).toMatch(/^https?:\/\//)
    })

    it('handles string or number ID cleanly', () => {
      expect(getMovieEmbedUrl('157336')).toContain('/embed/157336')
    })
  })

  describe('getTVEmbedUrl', () => {
    it('generates correct embed url for show with season and episode', () => {
      const url = getTVEmbedUrl(1399, 1, 1)
      expect(url).toContain('/embedtv/1399&s=1&e=1')
    })

    it('handles string parameters', () => {
      const url = getTVEmbedUrl('1399', '2', '5')
      expect(url).toContain('/embedtv/1399&s=2&e=5')
    })

    it('supports alternative providers', () => {
      const p2 = getTVEmbedUrl(1399, 1, 1, 'vidlink')
      expect(p2).toContain('vidlink.pro')

      const p3 = getTVEmbedUrl(1399, 1, 1, '2embed')
      expect(p3).toContain('2embed.cc')

    })

    it('encodes documented subtitle preferences only for the documented provider', () => {
      expect(getMovieEmbedUrl(603, 'vidfast', { subtitleLanguage: 'ar' })).toContain('?sub=ar')
      expect(getMovieEmbedUrl(603, 'vidlink', { subtitleLanguage: 'ar' })).not.toContain('sub=ar')
    })

    it('rejects malformed route values instead of coercing them', () => {
      for (const value of ['abc', '1abc', '0', '-1', '1.5', 'NaN', 'Infinity', '']) {
        expect(() => getTVEmbedUrl(1399, value, 1)).toThrow()
      }
    })
  })

  describe('provider selection', () => {
    it('declares conservative capabilities for every configured provider', () => {
      expect(PROVIDERS.every((provider) => provider.observabilityTier === 'C')).toBe(true)
      expect(PROVIDERS.every((provider) => provider.capabilities.qualityControl === 'none')).toBe(true)
      expect(PROVIDERS.every((provider) => provider.capabilities.audioLanguagePreference === false)).toBe(true)
    })

    it('allows registry-owned external embeds while keeping native trust gating', () => {
      expect(isProviderEligible({ ...PROVIDERS[0], trustEligible: false })).toBe(true)
      expect(isProviderEligible(PROVIDERS[0])).toBe(true)
      expect(isProviderEligible(verifiedProviders[0])).toBe(true)
    })

    it('keeps CSP frame origins aligned with the provider registry', () => {
      const config = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8')
      const frameSrc = config.match(/frame-src[^\n]+/)?.[0] ?? ''
      for (const provider of PROVIDERS) expect(frameSrc).toContain(provider.origin)
      expect(frameSrc).toContain('https://www.youtube.com')
      expect(frameSrc).not.toContain('*')
      expect(config).not.toContain('X-XSS-Protection')
    })

    it('does not loop after every provider has been attempted', () => {
      const ranked = rankProviders({
        attemptedProviderIds: ['vidfast', 'vidlink', '2embed', 'videasy', 'nontongo'],
      })
      expect(ranked).toHaveLength(0)
    })

    it('prefers reliable providers over a single fast success', () => {
      const ranked = rankProviders({
        providers: verifiedProviders,
        health: {
          vidfast: { attempts: 1, successes: 1, startupLatencyEWMA: 500 },
          vidlink: { attempts: 105, successes: 100, startupLatencyEWMA: 1200 },
        },
      })
      expect(ranked[0].id).toBe('vidlink')
    })

    it('demotes the known dead embed path below the verified default provider', () => {
      expect(rankProviders().map((provider) => provider.id)[0]).toBe('2embed')
    })

    it('excludes an open circuit and allows it after cooldown', () => {
      const now = 1_000_000
      const health = { vidfast: { ...emptyProviderHealth('vidfast'), cooldownUntil: now + 60_000, circuit: 'OPEN' as const } }
      expect(rankProviders({ providers: verifiedProviders, health, now }).map((p) => p.id)).not.toContain('vidfast')
      expect(rankProviders({ providers: verifiedProviders, health, now: now + 60_001 }).map((p) => p.id)).toContain('vidfast')
    })

    it('honors manual server selection while preserving health ranking in auto mode', () => {
      const health = {
        vidfast: { attempts: 1, successes: 0, startupLatencyEWMA: 9000 },
        vidlink: { attempts: 20, successes: 19, startupLatencyEWMA: 500 },
      }
      expect(getInitialProviderIdForMode({ defaultServer: 'vidfast', playerMode: 'manual' }, {
        providers: verifiedProviders,
        health,
        mediaType: 'movie',
      })).toBe('vidfast')
      expect(getInitialProviderIdForMode({ defaultServer: 'vidfast', playerMode: 'auto' }, {
        providers: verifiedProviders,
        health,
        mediaType: 'movie',
      })).toBe('vidlink')
    })

    it('allows only one half-open recovery trial after cooldown', () => {
      const now = 1_000_000
      expect(isProviderAvailable({ cooldownUntil: now - 1, circuit: 'HALF_OPEN' }, now)).toBe(true)
      expect(isProviderAvailable({ cooldownUntil: now - 1, circuit: 'HALF_OPEN', halfOpenTrialAt: now - 10 }, now)).toBe(false)
      expect(isProviderAvailable({ cooldownUntil: now + 1, circuit: 'OPEN' }, now)).toBe(false)
    })

  })

  it('validates only strict positive integer route segments', () => {
    expect(isStrictPositiveInteger('12')).toBe(true)
    expect(isStrictPositiveInteger('1abc')).toBe(false)
    expect(isStrictPositiveInteger('1.5')).toBe(false)
    expect(isStrictPositiveInteger(0)).toBe(false)
  })

  it('records the last stable provider error category and clears it on recovery', () => {
    const values = new Map<string, string>()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    })
    expect(recordProviderFailure('vidsrc-wiki', 'timeout', 1_000).lastErrorCategory).toBe('timeout')
    expect(recordProviderFailure('vidsrc-wiki', 'error', 2_000).lastErrorCategory).toBe('frame-error')
    expect(recordProviderSuccess('vidsrc-wiki', 300, 3_000).lastErrorCategory).toBeNull()
    vi.unstubAllGlobals()
  })

  describe('attempt state machine', () => {
    it('ignores stale timeout or frame callbacks', () => {
      const first = beginAttempt(initialAttemptState, 'vidsrc-wiki')
      const second = beginAttempt(first, 'vidsrc-xyz')
      expect(transitionAttempt(second, first.attemptId, 'failed')).toBe(second)
      expect(transitionAttempt(second, second.attemptId, 'frame-loaded').phase).toBe('frame-loaded')
    })

    it('rejects callbacks from the previous provider even when the numeric id is reused by a caller', () => {
      const first = beginAttempt(initialAttemptState, 'vidsrc-wiki')
      const second = beginAttempt(first, 'vidsrc-xyz')
      expect(isCurrentAttempt(second, first.attemptId, first.providerId!)).toBe(false)
      expect(isCurrentAttempt(second, second.attemptId, second.providerId!)).toBe(true)
    })

    it('keeps the hard failure path after a warning transition', () => {
      const attempt = beginAttempt(initialAttemptState, 'vidsrc-wiki')
      const warning = transitionAttempt(attempt, attempt.attemptId, 'timeout-warning')
      const failed = transitionAttempt(warning, attempt.attemptId, 'failed')
      expect(failed.phase).toBe('failed')
    })

    it('terminates exhaustion and invalidates attempts when offline', () => {
      const attempt = beginAttempt(initialAttemptState, 'vidsrc-wiki')
      expect(exhaustAttempts(attempt).phase).toBe('exhausted')
      expect(setOffline(attempt).attemptId).toBeGreaterThan(attempt.attemptId)
    })

    it('starts a fresh attempt after reconnecting from offline', () => {
      const attempt = beginAttempt(initialAttemptState, 'vidsrc-wiki')
      const offline = setOffline(attempt)
      const online = resumeOnline(offline)
      expect(online.phase).toBe('idle')
      expect(online.attemptedProviderIds).toEqual([])
      expect(online.attemptId).toBeGreaterThan(offline.attemptId)
    })

    it('reloads only the player attempt and clears the attempted-provider cycle', () => {
      const attempt = beginAttempt(initialAttemptState, 'vidsrc-wiki')
      const exhausted = exhaustAttempts(attempt)
      const reloaded = reloadAttempt(exhausted)
      expect(reloaded.phase).toBe('idle')
      expect(reloaded.attemptedProviderIds).toEqual([])
      expect(reloaded.attemptId).toBeGreaterThan(exhausted.attemptId)
    })

    it('does not accept provider events without an explicitly trusted origin', () => {
      expect(parseDocumentedProviderEvent({ origin: 'https://v1.vidsrc.wiki', data: { type: 'PLAYBACK_STARTED' } }, 'vidsrc-wiki')).toBeNull()
      expect(parseDocumentedProviderEvent({ origin: 'https://evil.example', data: { type: 'PLAYBACK_STARTED' } }, 'vidsrc-wiki')).toBeNull()
    })

    it('does not mistake a malformed progress event for playback evidence', () => {
      expect(parseDocumentedProviderEvent({ origin: 'https://v1.vidsrc.wiki', data: { type: 'PROGRESS', currentTime: '10', duration: 100 } }, 'vidsrc-wiki')).toBeNull()
    })

    it('applies recent failure and timeout penalties when ranking close providers', () => {
      const now = 1_000_000
      const ranked = rankProviders({
        providers: verifiedProviders,
        now,
        health: {
          vidfast: { attempts: 20, successes: 19, successEWMA: 0.95, startupLatencyEWMA: 500, lastFailureAt: now - 1_000, timeouts: 4 },
          vidlink: { attempts: 20, successes: 19, successEWMA: 0.95, startupLatencyEWMA: 500 },
        },
      })
      expect(ranked[0].id).toBe('vidlink')
    })
  })

  describe('playerErrorMessage', () => {
    it('returns human-readable message for each error code', () => {
      const codes: PlayerErrorCode[] = [
        'PROVIDER_LOAD_ERROR',
        'PLAYER_TIMEOUT',
        'NETWORK_OFFLINE',
        'STREAM_UNAVAILABLE',
        'INVALID_MEDIA_ID',
        'INVALID_EPISODE',
        'EMBED_BLOCKED',
        'UNKNOWN',
      ]

      for (const code of codes) {
        const msg = playerErrorMessage(code)
        expect(typeof msg).toBe('string')
        expect(msg.length).toBeGreaterThan(10)
      }
    })
  })
})
