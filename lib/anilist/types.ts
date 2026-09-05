import type { MediaRef } from '@/lib/media/types'

export type AnimeFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC'

export interface AnimeListItem extends MediaRef {
  source: 'anilist'
  kind: 'anime'
  title: string
  originalTitle?: string
  romajiTitle?: string
  year?: number
  season?: string
  format?: AnimeFormat
  status?: string
  episodes?: number
  score?: number
  popularity?: number
  posterUrl?: string
  bannerUrl?: string
  description?: string
}

export interface AnimeDetail extends AnimeListItem {
  japaneseTitle?: string
  durationMinutes?: number
  genres: string[]
  tags: Array<{ id: number; name: string; rank?: number }>
  studios: Array<{ id: number; name: string; isMain: boolean }>
  airing?: {
    status?: string
    nextEpisode?: number
    nextAiringAt?: string
  }
  characters: Array<{ id: number; name: string; imageUrl?: string; role?: string; voiceActor?: string }>
  staff: Array<{ id: number; name: string; role: string; imageUrl?: string }>
  relations: Array<{ relation: string; media: AnimeListItem }>
  recommendations: AnimeListItem[]
  trailer?: { site: 'youtube'; videoId: string; thumbnailUrl?: string }
  externalIds?: { malId?: number }
}

export interface AnimePageResponse<T> {
  Page: {
    media: T[]
    pageInfo?: { currentPage?: number; hasNextPage?: boolean; total?: number }
  }
}

export interface AnimeMediaResponse<T> {
  Media: T | null
}
