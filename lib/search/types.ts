import type { MediaRef } from '@/lib/media/types'

export interface MediaSearchResult {
  ref: MediaRef
  title: string
  originalTitle?: string
  year?: number
  posterUrl?: string
  backdropUrl?: string
  rating?: number
  popularity?: number
  sourceFields?: Record<string, unknown>
}
