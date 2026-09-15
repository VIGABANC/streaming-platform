import { type PlaybackRequest, type PlaybackSource, type PlaybackMediaType, type ProviderUrlOptions } from '@/lib/player'
import { getPlaybackSource } from '@/lib/playback-resolver'

export type PlaybackEngineKind = 'external-embed' | 'native-media'

export interface PlaybackEngineContext {
  mediaType: PlaybackMediaType
  mediaId: string | number
  season?: string | number
  episode?: string | number
  providerId: string
  options?: ProviderUrlOptions
  source?: PlaybackSource
}

export interface PlaybackEngine {
  readonly kind: PlaybackEngineKind
  readonly ownsMediaControls: boolean
  readonly canVerifyPlayback: boolean
  getSource(context: PlaybackEngineContext): string | null
}

/** The only engine currently enabled: an opaque, cross-origin provider iframe. */
export const ExternalEmbedEngine: PlaybackEngine = {
  kind: 'external-embed',
  ownsMediaControls: false,
  canVerifyPlayback: false,
  getSource(context) {
    if (context.source?.mode === 'external-embed') return context.source.url
    const request: PlaybackRequest = {
      mediaType: context.mediaType,
      mediaId: context.mediaId,
      season: context.season,
      episode: context.episode,
      preferredProviderId: context.providerId,
    }
    return getPlaybackSource(request, context.providerId)?.url ?? null
  },
}

/**
 * Contract for a future authorized direct-media implementation. It is kept as
 * a type boundary so native controls cannot accidentally be rendered for an
 * opaque provider. No production source currently satisfies this contract.
 */
export interface NativeMediaEngine extends PlaybackEngine {
  readonly kind: 'native-media'
  readonly ownsMediaControls: true
  readonly canVerifyPlayback: true
}

export const NativeMediaEngine: NativeMediaEngine = {
  kind: 'native-media',
  ownsMediaControls: true,
  canVerifyPlayback: true,
  getSource(context) {
    return context.source?.mode === 'native-media' && context.source.authorizationStatus === 'authorized'
      ? context.source.url
      : null
  },
}
