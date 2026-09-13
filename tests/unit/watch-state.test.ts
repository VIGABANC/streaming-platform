import { describe, expect, it } from 'vitest'
import { createAnimeWatchContext } from '@/lib/watch-state'

describe('watch state context', () => {
  it('stores anime episode context without inventing an unavailable provider', () => {
    expect(createAnimeWatchContext({
      id: 42,
      title: 'Anime title',
      episode: 3,
      episodeTitle: 'Episode three',
    })).toMatchObject({
      id: 42,
      media_type: 'anime',
      episode: 3,
      providerId: null,
      playbackMode: 'external-embed',
      verificationState: 'not-started',
    })
  })
})
