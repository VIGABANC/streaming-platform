import { describe, expect, it } from 'vitest'
import { DEFAULT_PROVIDER, getInitialProviderId } from '@/lib/player'

describe('playback settings', () => {
  it('uses a saved supported provider', () => {
    expect(getInitialProviderId('vidsrc-wiki')).toBe('vidsrc-wiki')
  })

  it('falls back when a saved provider is no longer supported', () => {
    expect(getInitialProviderId('removed-provider')).toBe(DEFAULT_PROVIDER)
  })
})
