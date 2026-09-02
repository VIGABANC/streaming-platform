import { describe, it, expect } from 'vitest'
import {
  getMovieEmbedUrl,
  getTVEmbedUrl,
  playerErrorMessage,
  type PlayerErrorCode,
} from '@/lib/player'

describe('Player Architecture & URL Builders', () => {
  describe('getMovieEmbedUrl', () => {
    it('generates correct embed url for movie IDs', () => {
      const url = getMovieEmbedUrl(603)
      expect(url).toContain('/movie/603')
      expect(url).toMatch(/^https?:\/\//)
    })

    it('handles string or number ID cleanly', () => {
      expect(getMovieEmbedUrl('157336')).toContain('/movie/157336')
    })
  })

  describe('getTVEmbedUrl', () => {
    it('generates correct embed url for show with season and episode', () => {
      const url = getTVEmbedUrl(1399, 1, 1)
      expect(url).toContain('/tv/1399/1/1')
    })

    it('handles string parameters', () => {
      const url = getTVEmbedUrl('1399', '2', '5')
      expect(url).toContain('/tv/1399/2/5')
    })
  })

  describe('playerErrorMessage', () => {
    it('returns human-readable message for each error code', () => {
      const codes: PlayerErrorCode[] = [
        'PROVIDER_LOAD_ERROR',
        'PLAYER_TIMEOUT',
        'NETWORK_OFFLINE',
        'STREAM_UNAVAILABLE',
        'INVALID_MEDIA_ID',
        'INVALID_EPISODE',
        'EMBED_BLOCKED',
        'UNKNOWN',
      ]

      for (const code of codes) {
        const msg = playerErrorMessage(code)
        expect(typeof msg).toBe('string')
        expect(msg.length).toBeGreaterThan(10)
      }
    })
  })
})
