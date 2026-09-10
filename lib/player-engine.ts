import { getMovieEmbedUrl, getTVEmbedUrl, type ProviderUrlOptions } from '@/lib/player'

export type PlaybackEngineKind = 'external-embed' | 'native-media'

export interface PlaybackEngineContext {
  mediaType: 'movie' | 'tv'
  mediaId: string | number
  season?: string | number
  episode?: string | number
  providerId: string
  options?: ProviderUrlOptions
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
    if (context.mediaType === 'movie') return getMovieEmbedUrl(context.mediaId, context.providerId, context.options)
    return getTVEmbedUrl(context.mediaId, context.season ?? 1, context.episode ?? 1, context.providerId, context.options)
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
