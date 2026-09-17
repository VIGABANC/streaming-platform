export type WatchmodeMediaType = 'movie' | 'tv'

export interface WatchmodeInput {
  tmdbId: number | string
  region?: string
  mediaType?: WatchmodeMediaType
  type?: WatchmodeMediaType
}

export interface ProviderLink {
  providerId: number
  name: string
  type: string
  url: string
}

export type WatchmodeLinksResult =
  | { status: 'disabled'; links: [] }
  | { status: 'unavailable'; links: [] }
  | { status: 'success'; links: ProviderLink[] }

export interface WatchmodeSourceResponse {
  source_id?: unknown
  name?: unknown
  type?: unknown
  web_url?: unknown
  ios_url?: unknown
  android_url?: unknown
}
