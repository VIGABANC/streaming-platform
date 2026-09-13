import { describe, expect, it } from 'vitest'
import { isPlaybackProviderEligible, type PlaybackProviderVerification } from '@/lib/playback-verification'

const verification = (overrides: Partial<PlaybackProviderVerification> = {}): PlaybackProviderVerification => ({
  providerId: 'test-provider',
  authorizationEvidence: ['operator approval'],
  originChecks: ['https://player.example.test'],
  allowedEmbeddingContexts: ['cross-origin-iframe'],
  lastVerifiedAt: new Date().toISOString(),
  verificationMethod: 'manual-review',
  riskNotes: [],
  enabled: true,
  ...overrides,
})

describe('playback provider verification', () => {
  it('rejects an unverified provider even when its origin is HTTPS', () => {
    expect(isPlaybackProviderEligible({
      id: 'test-provider',
      origin: 'https://player.example.test',
      playbackMode: 'external-embed',
      authorizationStatus: 'unverified',
      verification: verification({ enabled: false, authorizationEvidence: [] }),
    })).toBe(false)
  })

  it('requires authorization evidence, origin checks, context, and a fresh enabled record', () => {
    const provider = {
      id: 'test-provider',
      origin: 'https://player.example.test',
      playbackMode: 'external-embed' as const,
      authorizationStatus: 'authorized' as const,
      verification: verification(),
    }

    expect(isPlaybackProviderEligible(provider)).toBe(true)
    expect(isPlaybackProviderEligible({ ...provider, verification: verification({ authorizationEvidence: [] }) })).toBe(false)
    expect(isPlaybackProviderEligible({ ...provider, verification: verification({ originChecks: [] }) })).toBe(false)
    expect(isPlaybackProviderEligible({ ...provider, verification: verification({ allowedEmbeddingContexts: [] }) })).toBe(false)
    expect(isPlaybackProviderEligible({ ...provider, verification: verification({ lastVerifiedAt: '2000-01-01T00:00:00.000Z' }) })).toBe(false)
  })
})
