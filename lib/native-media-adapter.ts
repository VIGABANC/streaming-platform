import { validatePlaybackUrl, type PlaybackSource } from './player'
import type { PlaybackMediaType } from './player'

export type NativeMediaFormat = 'mp4' | 'hls' | 'dash'

export interface AuthorizedNativeMediaCandidate {
  id: string
  providerId: string
  providerName: string
  mediaType: PlaybackMediaType
  url: string
  origin: string
  format: NativeMediaFormat
  qualityCapability: PlaybackSource['qualityCapability']
  subtitleCapability: PlaybackSource['subtitleCapability']
  audioTrackCapability: PlaybackSource['audioTrackCapability']
  documentedReadiness?: 'documented-api'
}

/**
 * Empty until a VEYRA operator records an explicit authorization decision.
 * This is deliberately not populated from a browser-controlled URL or a
 * generic environment override.
 */
export const AUTHORIZED_NATIVE_MEDIA_ORIGINS: readonly string[] = []

export function normalizeAuthorizedNativeSource(
  candidate: AuthorizedNativeMediaCandidate,
  authorizedOrigins: readonly string[] = AUTHORIZED_NATIVE_MEDIA_ORIGINS,
): PlaybackSource | null {
  if (!authorizedOrigins.includes(candidate.origin)) return null
  if (!candidate.url || candidate.format === undefined) return null

  try {
    const url = validatePlaybackUrl(candidate.url, { origin: candidate.origin })
    return {
      id: candidate.id,
      providerId: candidate.providerId,
      providerName: candidate.providerName,
      mode: 'native-media',
      mediaType: candidate.mediaType,
      url,
      origin: candidate.origin,
      format: candidate.format,
      availability: 'available',
      verification: 'native-events',
      authorizationStatus: 'authorized',
      qualityCapability: candidate.qualityCapability,
      subtitleCapability: candidate.subtitleCapability,
      audioTrackCapability: candidate.audioTrackCapability,
      documentedReadiness: candidate.documentedReadiness ?? 'documented-api',
    }
  } catch {
    return null
  }
}
