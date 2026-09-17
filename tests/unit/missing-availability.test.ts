import { describe, expect, it } from 'vitest'
import { MISSING_AVAILABILITY_COPY, parseMissingAvailabilityReport } from '@/lib/missing-availability'

describe('missing availability reports', () => {
  it('keeps only minimal source, region, media, provider, and description context', () => {
    expect(parseMissingAvailabilityReport({ source: 'tmdb', sourceId: '1007757', region: 'ma', mediaType: 'movie', providerId: 'vidsrc-wiki', description: 'Not available' })).toEqual({
      source: 'tmdb', sourceId: '1007757', region: 'MA', mediaType: 'movie', providerId: 'vidsrc-wiki', description: 'Not available',
    })
  })

  it('rejects personal or promise-like fields', () => {
    expect(() => parseMissingAvailabilityReport({ email: 'user@example.com' })).toThrow()
    expect(MISSING_AVAILABILITY_COPY).toContain('does not request or promise uploading')
  })
})
