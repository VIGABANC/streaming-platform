export interface AnimePlaybackCta {
  kind: 'watch' | 'metadata'
  label: 'Watch episode 1' | 'View episode list'
}

export function getAnimePlaybackCta(playbackStatus: string | undefined): AnimePlaybackCta {
  return playbackStatus === 'ready'
    ? { kind: 'watch', label: 'Watch episode 1' }
    : { kind: 'metadata', label: 'View episode list' }
}

export function getAnimeEpisodeThumbnail(episodeNumber: number, coverImage: string | null): {
  src: string | null
  alt: string
  placeholder: string
  wrapperClass: 'aspect-video'
} {
  return {
    src: coverImage,
    alt: `Episode ${episodeNumber} thumbnail`,
    placeholder: `E${episodeNumber}`,
    wrapperClass: 'aspect-video',
  }
}

export const animeEpisodeThumbnailWrapperClass = 'aspect-video'
