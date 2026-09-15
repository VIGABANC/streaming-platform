import { describe, expect, it } from 'vitest'
import {
  PROVIDERS,
  validatePlaybackUrl,
  type PlaybackRequest,
} from '@/lib/player'
import { resolvePlaybackSources } from '@/lib/playback-resolver'
import { normalizeAuthorizedNativeSource } from '@/lib/native-media-adapter'

describe('playback provider registry and resolver', () => {
  it('declares the complete provider contract without quality overclaims', () => {
    expect(PROVIDERS).toHaveLength(4)
    expect(PROVIDERS.every((provider) => provider.playbackMode === 'external-embed')).toBe(true)
    expect(PROVIDERS.every((provider) => provider.qualityCapability === 'provider-controlled')).toBe(true)
    expect(PROVIDERS.every((provider) => provider.documentedReadiness === 'none')).toBe(true)
    expect(PROVIDERS.every((provider) => provider.supportedRegions.includes('global'))).toBe(true)
  })

  it('does not resolve unverified movie embeds as playable sources', () => {
    const request: PlaybackRequest = { mediaType: 'movie', mediaId: 603, region: 'US' }
    const result = resolvePlaybackSources(request)

    expect(result.status).toBe('unavailable')
    expect(result.sources).toEqual([])
    expect(result.reason).toBe('no-source')
  })

  it('does not fabricate Anime sources when no provider supports Anime', () => {
    const result = resolvePlaybackSources({ mediaType: 'anime', mediaId: 1, episode: 1 })

    expect(result.status).toBe('unavailable')
    expect(result.sources).toEqual([])
    expect(result.reason).toBe('unsupported')
  })

  it('rejects unsafe or mismatched provider URLs', () => {
    expect(() => validatePlaybackUrl('http://v1.vidsrc.wiki/embed/movie/603', PROVIDERS[0])).toThrow('HTTPS')
    expect(() => validatePlaybackUrl('https://evil.example/embed/movie/603', PROVIDERS[0])).toThrow('ORIGIN')
    expect(() => validatePlaybackUrl('https://v1.vidsrc.wiki/embed/movie/603', PROVIDERS[0])).not.toThrow()
  })

  it('rejects malformed playback identities before source construction', () => {
    expect(resolvePlaybackSources({ mediaType: 'movie', mediaId: '1abc' }).status).toBe('invalid')
    expect(resolvePlaybackSources({ mediaType: 'tv', mediaId: 1399, season: 0, episode: 1 }).status).toBe('invalid')
    expect(resolvePlaybackSources({ mediaType: 'tv', mediaId: 1399, season: 1, episode: '2abc' }).status).toBe('invalid')
  })

  it('accepts native media only when the source is explicitly authorized and HTTPS', () => {
    const nativeSource = {
      id: 'authorized:603',
      providerId: 'authorized-cdn',
      providerName: 'Authorized CDN',
      mode: 'native-media' as const,
      mediaType: 'movie' as const,
      url: 'https://media.example.test/movie/603.m3u8',
      format: 'hls' as const,
      origin: 'https://media.example.test',
      availability: 'available' as const,
      verification: 'native-events' as const,
      authorizationStatus: 'authorized' as const,
      qualityCapability: 'native' as const,
      subtitleCapability: 'native' as const,
      audioTrackCapability: 'native' as const,
      documentedReadiness: 'documented-api' as const,
    }
    expect(resolvePlaybackSources({ mediaType: 'movie', mediaId: 603, nativeSources: [nativeSource] }).sources[0]).toEqual(nativeSource)
    const unverifiedResult = resolvePlaybackSources({ mediaType: 'movie', mediaId: 603, nativeSources: [{ ...nativeSource, authorizationStatus: 'unverified' as const }] })
    expect(unverifiedResult.sources.some((source) => source.mode === 'native-media')).toBe(false)
    const mismatchedResult = resolvePlaybackSources({ mediaType: 'tv', mediaId: 603, season: 1, episode: 1, nativeSources: [nativeSource] })
    expect(mismatchedResult.sources.some((source) => source.mode === 'native-media')).toBe(false)
    const unsupportedFormat = resolvePlaybackSources({ mediaType: 'movie', mediaId: 603, nativeSources: [{ ...nativeSource, format: undefined }] })
    expect(unsupportedFormat.sources.some((source) => source.mode === 'native-media')).toBe(false)
  })

  it('normalizes native media only through the explicit authorization allowlist', () => {
    const candidate = {
      id: 'authorized:603', providerId: 'authorized-cdn', providerName: 'Authorized CDN',
      mediaType: 'movie' as const, url: 'https://media.example.test/movie/603.m3u8',
      origin: 'https://media.example.test', format: 'hls' as const,
      qualityCapability: 'documented-api' as const, subtitleCapability: 'documented-api' as const,
      audioTrackCapability: 'documented-api' as const,
    }
    expect(normalizeAuthorizedNativeSource(candidate)).toBeNull()
    const source = normalizeAuthorizedNativeSource(candidate, [candidate.origin])
    expect(source?.mode).toBe('native-media')
    expect(source?.authorizationStatus).toBe('authorized')
    expect(source?.format).toBe('hls')
  })
})
