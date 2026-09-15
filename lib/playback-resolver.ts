import {
  isStrictPositiveInteger,
  PROVIDERS,
  rankProviders,
  validatePlaybackUrl,
  type PlaybackRequest,
  type PlaybackSource,
  type StreamProvider,
} from './player'

export interface PlaybackResolution {
  status: 'success' | 'empty' | 'partial' | 'unavailable' | 'invalid'
  sources: PlaybackSource[]
  reason?: 'invalid-request' | 'unsupported' | 'provider-error' | 'no-source'
}

function isValidRequest(request: PlaybackRequest): boolean {
  if (!isStrictPositiveInteger(request.mediaId)) return false
  if (request.mediaType === 'movie') return request.season == null && request.episode == null
  if (request.mediaType === 'anime') return isStrictPositiveInteger(request.episode ?? '') && (request.season == null || isStrictPositiveInteger(request.season))
  return isStrictPositiveInteger(request.season ?? '') && isStrictPositiveInteger(request.episode ?? '')
}

function sourceForProvider(provider: StreamProvider, request: PlaybackRequest): PlaybackSource | null {
  if (!provider.supportedMediaTypes.includes(request.mediaType)) return null
  if (request.mediaType !== 'movie' && !provider.supportsEpisodes) return null
  const url = provider.sourceBuilder(request, { subtitleLanguage: 'auto' })
  if (!url) return null
  const validatedUrl = validatePlaybackUrl(url, provider)
  return {
    id: `${provider.id}:${request.mediaType}:${request.mediaId}:${request.season ?? ''}:${request.episode ?? ''}`,
    providerId: provider.id,
    providerName: provider.name,
    mode: provider.playbackMode,
    mediaType: request.mediaType,
    url: validatedUrl,
    origin: provider.origin,
    availability: provider.authorizationStatus === 'prohibited' ? 'unavailable' : provider.authorizationStatus === 'unverified' ? 'unverified' : 'available',
    verification: provider.playbackMode === 'native-media' ? 'native-events' : provider.documentedReadiness === 'documented-api' ? 'documented-api' : 'frame-load-only',
    authorizationStatus: provider.authorizationStatus,
    qualityCapability: provider.qualityCapability,
    subtitleCapability: provider.subtitleCapability,
    audioTrackCapability: provider.audioTrackCapability,
    documentedReadiness: provider.documentedReadiness,
  }
}

export function resolvePlaybackSources(request: PlaybackRequest): PlaybackResolution {
  if (!isValidRequest(request)) return { status: 'invalid', sources: [], reason: 'invalid-request' }

  const providers = rankProviders({
    mediaType: request.mediaType,
    attemptedProviderIds: request.attemptedProviderIds,
    preferredProviderId: request.preferredProviderId,
  })
  const sources: PlaybackSource[] = (request.nativeSources ?? []).filter((source) => {
    if (source.mode !== 'native-media' || source.authorizationStatus !== 'authorized' || source.availability !== 'available' || source.mediaType !== request.mediaType || !source.format) return false
    try {
      validatePlaybackUrl(source.url, { origin: source.origin })
      return true
    } catch {
      return false
    }
  })
  for (const provider of providers) {
    try {
      const source = sourceForProvider(provider, request)
      if (source) sources.push(source)
    } catch {
      // A malformed registry entry is unavailable, never a browser-controlled URL.
    }
  }

  if (sources.length === 0) {
    const supportsMedia = PROVIDERS.some((provider) => provider.supportedMediaTypes.includes(request.mediaType))
    return { status: 'unavailable', sources: [], reason: supportsMedia ? 'no-source' : 'unsupported' }
  }

  const hasUsableSource = sources.some((source) => source.availability === 'available' || source.availability === 'unverified')
  return { status: hasUsableSource ? 'success' : 'unavailable', sources, reason: hasUsableSource ? undefined : 'provider-error' }
}

export function getPlaybackSource(request: PlaybackRequest, providerId?: string): PlaybackSource | null {
  return resolvePlaybackSources(request).sources.find((source) => !providerId || source.providerId === providerId) ?? null
}
