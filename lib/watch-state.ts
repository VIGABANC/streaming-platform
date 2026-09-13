import type { ContinueWatchingItem } from './store'

export interface AnimeWatchContextInput {
  id: number
  title: string
  posterPath?: string | null
  backdropPath?: string | null
  episode: number
  episodeTitle?: string
}

export function createAnimeWatchContext(input: AnimeWatchContextInput): ContinueWatchingItem {
  return {
    id: input.id,
    media_type: 'anime',
    title: input.title,
    poster_path: input.posterPath,
    backdrop_path: input.backdropPath,
    episode: input.episode,
    episodeTitle: input.episodeTitle,
    providerId: null,
    playbackMode: 'external-embed',
    verificationState: 'not-started',
    lastOpenedAt: Date.now(),
  }
}
