import type {
  PlaybackMode,
  PlaybackProviderVerification,
  PlaybackVerificationEvidence,
  ProviderAuthorizationStatus,
} from './media-model'

export type { PlaybackProviderVerification } from './media-model'
export type { PlaybackSignal, PlaybackVerificationEvidence, PlaybackVerificationStage } from './media-model'

export const TRUSTED_PLAYBACK_SIGNALS = ['loadedmetadata', 'canplay', 'playing', 'provider-reported-state'] as const

export function isTrustedPlaybackSignal(signal: string): boolean {
  return (TRUSTED_PLAYBACK_SIGNALS as readonly string[]).includes(signal)
}

export function hasPlaybackSignalEvidence(evidence: PlaybackVerificationEvidence[] = []): boolean {
  return evidence.some((item) => item.stage === 'playback-signal' && item.passed && item.signal && isTrustedPlaybackSignal(item.signal))
}

export interface PlaybackProviderVerificationTarget {
  id: string
  origin: string
  playbackMode: PlaybackMode
  authorizationStatus: ProviderAuthorizationStatus
  verification: PlaybackProviderVerification
}

const VERIFICATION_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1_000

function contextForMode(mode: PlaybackMode): PlaybackProviderVerification['allowedEmbeddingContexts'][number] {
  return mode === 'native-media' ? 'native-media' : 'cross-origin-iframe'
}

export function isPlaybackProviderEligible(
  provider: PlaybackProviderVerificationTarget,
  now = Date.now(),
): boolean {
  const record = provider.verification
  if (!record || record.providerId !== provider.id || !record.enabled) return false
  if (provider.authorizationStatus !== 'authorized') return false
  if (!provider.origin.startsWith('https://')) return false
  if (!record.authorizationEvidence.length || !record.originChecks.includes(provider.origin)) return false
  if (!record.allowedEmbeddingContexts.includes(contextForMode(provider.playbackMode))) return false
  if (record.evidence && !hasPlaybackSignalEvidence(record.evidence)) return false
  if (!record.lastVerifiedAt) return false

  const verifiedAt = Date.parse(record.lastVerifiedAt)
  return Number.isFinite(verifiedAt) && verifiedAt <= now && now - verifiedAt <= VERIFICATION_MAX_AGE_MS
}
