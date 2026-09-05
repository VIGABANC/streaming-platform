import { describe, expect, it } from 'vitest'
import { DEFAULT_PROVIDER, getInitialProviderId } from '@/lib/player'
import { normalizeUserSettings, shouldReduceMotion, DEFAULT_USER_SETTINGS } from '@/lib/settings'

describe('playback settings', () => {
  it('uses a saved supported provider', () => {
    expect(getInitialProviderId('autoembed')).toBe('autoembed')
  })

  it('falls back when a saved provider is no longer supported', () => {
    expect(getInitialProviderId('removed-provider')).toBe(DEFAULT_PROVIDER)
  })

  it('normalizes malformed persisted settings to safe defaults', () => {
    expect(normalizeUserSettings({ defaultServer: 'removed-provider', ambientLighting: 'yes' })).toEqual(DEFAULT_USER_SETTINGS)
    expect(normalizeUserSettings({ ...DEFAULT_USER_SETTINGS, defaultServer: 'autoembed' }).defaultServer).toBe('autoembed')
  })

  it('uses the most restrictive reduced-motion preference', () => {
    expect(shouldReduceMotion({ ...DEFAULT_USER_SETTINGS, reducedMotion: false }, true)).toBe(true)
    expect(shouldReduceMotion({ ...DEFAULT_USER_SETTINGS, reducedMotion: true }, false)).toBe(true)
    expect(shouldReduceMotion({ ...DEFAULT_USER_SETTINGS, reducedMotion: false }, false)).toBe(false)
  })
})
