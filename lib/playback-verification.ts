import type {
  PlaybackMode,
  PlaybackProviderVerification,
  ProviderAuthorizationStatus,
} from './media-model'

export type { PlaybackProviderVerification } from './media-model'

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
  if (!record.lastVerifiedAt) return false

  const verifiedAt = Date.parse(record.lastVerifiedAt)
  return Number.isFinite(verifiedAt) && verifiedAt <= now && now - verifiedAt <= VERIFICATION_MAX_AGE_MS
}
