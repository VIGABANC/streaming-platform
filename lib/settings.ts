import type { UserSettings } from './store'

export const SUPPORTED_SERVER_IDS = ['vidsrc-wiki', 'vidsrc-xyz', '2embed', 'autoembed'] as const

export const DEFAULT_USER_SETTINGS: UserSettings = {
  autoplayNext: true,
  defaultServer: 'vidsrc-wiki',
  streamQuality: 'auto',
  ambientLighting: true,
  reducedMotion: false,
}

export function normalizeUserSettings(input: unknown): UserSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ...DEFAULT_USER_SETTINGS }
  const value = input as Record<string, unknown>
  return {
    autoplayNext: typeof value.autoplayNext === 'boolean' ? value.autoplayNext : DEFAULT_USER_SETTINGS.autoplayNext,
    defaultServer: typeof value.defaultServer === 'string' && (SUPPORTED_SERVER_IDS as readonly string[]).includes(value.defaultServer)
      ? value.defaultServer
      : DEFAULT_USER_SETTINGS.defaultServer,
    streamQuality: value.streamQuality === 'auto' || value.streamQuality === '1080p' || value.streamQuality === '720p'
      ? value.streamQuality
      : DEFAULT_USER_SETTINGS.streamQuality,
    ambientLighting: typeof value.ambientLighting === 'boolean' ? value.ambientLighting : DEFAULT_USER_SETTINGS.ambientLighting,
    reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : DEFAULT_USER_SETTINGS.reducedMotion,
  }
}

export function shouldReduceMotion(settings: Pick<UserSettings, 'reducedMotion'>, mediaQueryMatches: boolean): boolean {
  return settings.reducedMotion || mediaQueryMatches
}
