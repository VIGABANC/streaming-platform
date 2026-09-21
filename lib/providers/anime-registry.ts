import 'server-only'

export interface AnimeProviderConfig {
  id: string
  name: string
  type: 'consumet' | 'direct-api'
  baseUrl: string
  providerParam?: string
  requiresReferer?: boolean
  supportsDub: boolean
  supportsSub: boolean
  priority: number
  timeoutMs: number
}

const timeoutMs = Math.min(15_000, Math.max(1_000, Number(process.env.ANIME_PROVIDER_TIMEOUT_MS) || 10_000))
const consumet = process.env.CONSUMET_BASE_URL?.trim() || ''

export const ANIME_PROVIDERS: AnimeProviderConfig[] = [
  { id: 'gogoanime', name: 'Anitaku', type: 'consumet', baseUrl: consumet, providerParam: 'gogoanime', requiresReferer: true, supportsDub: true, supportsSub: true, priority: 1, timeoutMs },
  { id: 'animepahe', name: 'AnimePahe', type: 'consumet', baseUrl: consumet, providerParam: 'animepahe', requiresReferer: true, supportsDub: false, supportsSub: true, priority: 2, timeoutMs },
  { id: 'kickassanime', name: 'KickAssAnime', type: 'consumet', baseUrl: consumet, providerParam: 'kickassanime', supportsDub: true, supportsSub: true, priority: 3, timeoutMs },
  { id: 'reanime', name: 'ReAnime', type: 'direct-api', baseUrl: process.env.REANIME_BASE_URL?.trim() || '', supportsDub: true, supportsSub: true, priority: 4, timeoutMs },
  { id: 'anigo', name: 'Anigo', type: 'direct-api', baseUrl: process.env.ANIGO_BASE_URL?.trim() || '', supportsDub: true, supportsSub: true, priority: 5, timeoutMs },
]

export function getConfiguredAnimeProviders(): AnimeProviderConfig[] {
  return ANIME_PROVIDERS.filter((provider) => provider.baseUrl.length > 0).sort((a, b) => a.priority - b.priority)
}

export function getAnimeProvider(id: string): AnimeProviderConfig | undefined {
  return ANIME_PROVIDERS.find((provider) => provider.id === id)
}

export function providerOrigin(provider: AnimeProviderConfig): string | null {
  try { return new URL(provider.baseUrl).origin } catch { return null }
}

export const ANIME_TIMEOUT_MS = timeoutMs

// Provider URLs are always operator configuration; no public fallback is used.
export const ANIME_PROVIDER_LEGAL_NOTICE = 'Anime playback providers are operator-configured. Understand the legal implications before enabling them.'

export default ANIME_PROVIDERS
