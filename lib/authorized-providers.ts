import type { PlaybackMediaType, PlaybackSource } from './player'
import { normalizeAuthorizedNativeSource } from './native-media-adapter'

export interface AuthorizedProviderConfig {
  id: string
  origin: string
  authorization: 'LICENSED_PARTNER' | 'PUBLIC_DOMAIN' | 'CREATOR_OWNED'
  supportedMediaTypes: readonly PlaybackMediaType[]
  sourceFor: (mediaType: PlaybackMediaType, mediaId: string | number) => PlaybackSource | null
}

const archiveMovie = 'https://archive.org/download/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4'

export const AUTHORIZED_PROVIDERS: readonly AuthorizedProviderConfig[] = [{
  id: 'internet-archive',
  origin: 'https://archive.org',
  authorization: 'PUBLIC_DOMAIN',
  supportedMediaTypes: ['movie'],
  sourceFor: (mediaType, mediaId) => mediaType === 'movie' && String(mediaId) === 'night_of_the_living_dead'
    ? normalizeAuthorizedNativeSource({ id: 'ia:night_of_the_living_dead', providerId: 'internet-archive', providerName: 'Internet Archive', mediaType, url: archiveMovie, origin: 'https://archive.org', format: 'mp4', qualityCapability: 'provider-controlled', subtitleCapability: 'none', audioTrackCapability: 'native', documentedReadiness: 'documented-api' }, ['https://archive.org'])
    : null,
}]

export const FIRST_AUTHORIZED_PROVIDER = AUTHORIZED_PROVIDERS[0]
