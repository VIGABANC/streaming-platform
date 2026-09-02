import { describe, it, expect } from 'vitest'
import {
  titleOf,
  yearOf,
  poster,
  backdrop,
  formatRuntime,
  getCertification,
  getTrailer,
  type MovieDetail,
  type Video,
} from '@/lib/tmdb'

describe('TMDB Library Helpers', () => {
  describe('titleOf', () => {
    it('returns title for movies', () => {
      expect(titleOf({ title: 'Interstellar' })).toBe('Interstellar')
    })

    it('returns name for TV series', () => {
      expect(titleOf({ name: 'Breaking Bad' })).toBe('Breaking Bad')
    })

    it('falls back to Untitled when title and name are missing', () => {
      expect(titleOf({})).toBe('Untitled')
    })
  })

  describe('yearOf', () => {
    it('extracts 4-digit release year for movies', () => {
      expect(yearOf({ release_date: '2024-11-05' })).toBe('2024')
    })

    it('extracts 4-digit first air date for TV shows', () => {
      expect(yearOf({ first_air_date: '2008-01-20' })).toBe('2008')
    })

    it('returns empty string if dates are not provided', () => {
      expect(yearOf({})).toBe('')
    })
  })

  describe('poster and backdrop URL builders', () => {
    it('builds valid TMDB poster image URLs with requested size', () => {
      expect(poster('/path.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/path.jpg')
    })

    it('returns fallback SVG when poster path is missing', () => {
      expect(poster(null)).toBe('/poster-fallback.svg')
      expect(poster(undefined)).toBe('/poster-fallback.svg')
    })

    it('builds valid TMDB backdrop image URLs', () => {
      expect(backdrop('/backdrop.jpg', 'w1280')).toBe('https://image.tmdb.org/t/p/w1280/backdrop.jpg')
    })

    it('returns fallback SVG when backdrop path is missing', () => {
      expect(backdrop(null)).toBe('/backdrop-fallback.svg')
    })
  })

  describe('formatRuntime', () => {
    it('formats minutes into h and m', () => {
      expect(formatRuntime(148)).toBe('2h 28m')
      expect(formatRuntime(60)).toBe('1h')
      expect(formatRuntime(45)).toBe('45m')
    })

    it('handles zero or undefined runtime', () => {
      expect(formatRuntime(undefined)).toBe('')
      expect(formatRuntime(0)).toBe('')
    })
  })

  describe('getCertification', () => {
    it('extracts US certification from release dates', () => {
      const movie: Partial<MovieDetail> = {
        release_dates: {
          results: [
            {
              iso_3166_1: 'US',
              release_dates: [{ certification: 'PG-13', type: 3 }],
            },
          ],
        },
      }
      expect(getCertification(movie as MovieDetail)).toBe('PG-13')
    })

    it('returns empty string if US certification is not found', () => {
      const movie: Partial<MovieDetail> = {
        release_dates: { results: [] },
      }
      expect(getCertification(movie as MovieDetail)).toBe('')
    })
  })

  describe('getTrailer', () => {
    it('prioritizes official YouTube trailer', () => {
      const videos: Video[] = [
        { id: '1', key: 'teaser123', name: 'Teaser', site: 'YouTube', type: 'Teaser', official: false },
        { id: '2', key: 'trailer456', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true },
      ]
      const trailer = getTrailer({ results: videos })
      expect(trailer?.key).toBe('trailer456')
    })
  })
})
