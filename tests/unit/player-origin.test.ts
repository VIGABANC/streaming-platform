import { describe, expect, it } from 'vitest'
import { getMovieEmbedUrl, getTVEmbedUrl, isTrustedPlayerUrl } from '@/lib/player'

describe('player origin trust boundary', () => {
  it('accepts only provider-owned embed URLs with expected paths', () => {
    const movie = getMovieEmbedUrl(550, 'vidsrc-wiki')
    const episode = getTVEmbedUrl(1399, 1, 2, 'vidsrc-wiki')

    expect(isTrustedPlayerUrl(movie, 'vidsrc-wiki')).toBe(true)
    expect(isTrustedPlayerUrl(episode, 'vidsrc-wiki')).toBe(true)
    expect(isTrustedPlayerUrl('https://evil.example/embed/movie/550', 'vidsrc-wiki')).toBe(false)
    expect(isTrustedPlayerUrl('https://v1.vidsrc.wiki/account/settings', 'vidsrc-wiki')).toBe(false)
  })

  it('rejects malformed IDs and episode segments before URL construction', () => {
    expect(() => getMovieEmbedUrl('1abc')).toThrow('INVALID_MEDIA_ID')
    expect(() => getTVEmbedUrl(1399, '1.5', 2)).toThrow('INVALID_SEASON')
    expect(() => getTVEmbedUrl(1399, 1, 'Infinity')).toThrow('INVALID_EPISODE')
  })
})
