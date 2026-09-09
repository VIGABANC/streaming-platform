import { describe, expect, it } from 'vitest'
import {
  firstWithBackdrop,
  firstMovieWithBackdrop,
  heroGenreNames,
  mediaHref,
  mediaTypeOf,
  usableMedia,
} from '@/components/landing/landing-types'
import { normalizeSearchResults, searchShowcaseStatus } from '@/components/landing/search-showcase-data'
import { detailRuntime } from '@/components/landing/detail-showcase-data'
import type { Media, MovieDetail, TVDetail } from '@/lib/tmdb'

const movie: Media = {
  id: 101,
  title: 'Signal Bloom',
  media_type: 'movie',
  poster_path: '/signal-bloom.jpg',
}

const series: Media = {
  id: 202,
  name: 'Night Frequency',
  media_type: 'tv',
  poster_path: '/night-frequency.jpg',
}

describe('landing data normalization', () => {
  it('builds movie and TV detail hrefs from the established media type convention', () => {
    expect(mediaTypeOf(movie)).toBe('movie')
    expect(mediaHref(movie)).toBe('/movie/101')
    expect(mediaTypeOf(series)).toBe('tv')
    expect(mediaHref(series)).toBe('/tv/202')
  })

  it('excludes people while retaining movie and TV media', () => {
    const person = { id: 303, name: 'A Performer', media_type: 'person' } as Media

    expect(usableMedia([person, movie, series])).toEqual([movie, series])
  })

  it('selects the first usable media item with a backdrop', () => {
    const noBackdrop = { ...movie, backdrop_path: null }
    const personBackdrop = { id: 303, name: 'A Performer', media_type: 'person', backdrop_path: '/person.jpg' } as Media
    const firstBackdrop = { ...series, backdrop_path: '/first.jpg' }
    const laterBackdrop = { ...movie, id: 404, backdrop_path: '/later.jpg' }

    expect(firstWithBackdrop([noBackdrop, personBackdrop, firstBackdrop, laterBackdrop])).toBe(firstBackdrop)
  })

  it('selects only movie media for movie detail enrichment', () => {
    const tvBackdrop = { ...series, backdrop_path: '/tv-first.jpg' }
    const movieBackdrop = { ...movie, backdrop_path: '/movie-second.jpg' }

    expect(firstMovieWithBackdrop([tvBackdrop, movieBackdrop])).toBe(movieBackdrop)
  })

  it('uses named detail genres or list genre ids and limits hero metadata to three genres', () => {
    const detail = {
      ...movie,
      genres: [
        { id: 1, name: 'Neo-noir' },
        { id: 2, name: 'Mystery' },
        { id: 3, name: 'Thriller' },
        { id: 4, name: 'Drama' },
      ],
    }
    const listItem = { ...series, genre_ids: [10765, 18, 9648, 80] }

    expect(heroGenreNames(detail)).toEqual(['Neo-noir', 'Mystery', 'Thriller'])
    expect(heroGenreNames(listItem)).toEqual(['Sci-Fi & Fantasy', 'Drama', 'Mystery'])
  })

  it('uses missing-art items only when no poster-bearing media is available', () => {
    const missingArt = { id: 505, title: 'Archive Signal', media_type: 'movie', poster_path: null } as Media

    expect(usableMedia([missingArt, movie])).toEqual([movie])
    expect(usableMedia([missingArt])).toEqual([missingArt])
  })

  it('keeps source order and applies stable limits for media with missing optional fields', () => {
    const untitled = { id: 606, media_type: 'movie', poster_path: '/untitled.jpg' } as Media
    const second = { ...series, id: 707 }
    const third = { ...movie, id: 808 }

    expect(usableMedia([untitled, second, third], 2)).toEqual([untitled, second])
    expect(usableMedia([untitled, second, third], 0)).toEqual([])
  })
})

describe('landing finder data', () => {
  it('normalizes only movie and TV results from the existing search response', () => {
    expect(normalizeSearchResults({ results: [movie, series, { id: 303, media_type: 'person' }] })).toEqual([movie, series])
    expect(normalizeSearchResults({ results: 'not-an-array' })).toEqual([])
  })

  it('uses clear status labels for result, empty, and failure states', () => {
    expect(searchShowcaseStatus('results', 2, 'Dune')).toBe('2 signals found for Dune.')
    expect(searchShowcaseStatus('empty', 0, 'Dune')).toBe('No signals found for Dune.')
    expect(searchShowcaseStatus('error')).toContain('unavailable')
  })
})

describe('landing detail metadata', () => {
  it('uses movie runtime and TMDB TV episode runtime when available', () => {
    const movieDetail = { ...movie, media_type: 'movie', runtime: 155 } as MovieDetail
    const tvDetail = { ...series, media_type: 'tv', episode_run_time: [58] } as TVDetail

    expect(detailRuntime(movieDetail)).toBe('2h 35m')
    expect(detailRuntime(tvDetail)).toBe('58m')
  })
})
