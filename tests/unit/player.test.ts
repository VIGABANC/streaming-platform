import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  getMovieEmbedUrl,
  getTVEmbedUrl,
  isStrictPositiveInteger,
  rankProviders,
  emptyProviderHealth,
  playerErrorMessage,
  PROVIDERS,
  isProviderEligible,
  isProviderAvailable,
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

describe('Player Architecture & URL Builders', () => {
  describe('getMovieEmbedUrl', () => {
    it('generates correct embed url for movie IDs', () => {
      const url = getMovieEmbedUrl(603)
      expect(url).toContain('/movie/603')
      expect(url).toMatch(/^https?:\/\//)
    })

    it('handles string or number ID cleanly', () => {
      expect(getMovieEmbedUrl('157336')).toContain('/movie/157336')
    })
  })

  describe('getTVEmbedUrl', () => {
    it('generates correct embed url for show with season and episode', () => {
      const url = getTVEmbedUrl(1399, 1, 1)
      expect(url).toContain('/tv/1399/1/1')
    })

    it('handles string parameters', () => {
      const url = getTVEmbedUrl('1399', '2', '5')
      expect(url).toContain('/tv/1399/2/5')
    })

    it('supports alternative providers', () => {
      const p2 = getTVEmbedUrl(1399, 1, 1, 'vidsrc-xyz')
      expect(p2).toContain('vidsrc.xyz')

      const p3 = getTVEmbedUrl(1399, 1, 1, '2embed')
      expect(p3).toContain('2embed.cc')

      const p4 = getTVEmbedUrl(1399, 1, 1, 'autoembed')
      expect(p4).toContain('autoembed.cc')
    })

    it('encodes documented subtitle preferences only for the documented provider', () => {
      expect(getMovieEmbedUrl(603, 'vidsrc-wiki', { subtitleLanguage: 'ar' })).toContain('?sub=ar')
      expect(getMovieEmbedUrl(603, 'vidsrc-xyz', { subtitleLanguage: 'ar' })).not.toContain('sub=ar')
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

    it('treats trust eligibility as a hard gate', () => {
      expect(isProviderEligible({ ...PROVIDERS[0], trustEligible: false })).toBe(false)
      expect(isProviderEligible(PROVIDERS[0])).toBe(true)
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
        attemptedProviderIds: ['vidsrc-wiki', 'vidsrc-xyz', '2embed', 'autoembed'],
      })
      expect(ranked).toHaveLength(0)
    })

    it('prefers reliable providers over a single fast success', () => {
      const ranked = rankProviders({
        health: {
          'vidsrc-wiki': { attempts: 1, successes: 1, startupLatencyEWMA: 500 },
          'vidsrc-xyz': { attempts: 105, successes: 100, startupLatencyEWMA: 1200 },
        },
      })
      expect(ranked[0].id).toBe('vidsrc-xyz')
    })

    it('excludes an open circuit and allows it after cooldown', () => {
      const now = 1_000_000
      const health = { 'vidsrc-wiki': { ...emptyProviderHealth('vidsrc-wiki'), cooldownUntil: now + 60_000, circuit: 'OPEN' as const } }
      expect(rankProviders({ health, now }).map((p) => p.id)).not.toContain('vidsrc-wiki')
      expect(rankProviders({ health, now: now + 60_001 }).map((p) => p.id)).toContain('vidsrc-wiki')
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
        now,
        health: {
          'vidsrc-wiki': { attempts: 20, successes: 19, successEWMA: 0.95, startupLatencyEWMA: 500, lastFailureAt: now - 1_000, timeouts: 4 },
          'vidsrc-xyz': { attempts: 20, successes: 19, successEWMA: 0.95, startupLatencyEWMA: 500 },
        },
      })
      expect(ranked[0].id).toBe('vidsrc-xyz')
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
