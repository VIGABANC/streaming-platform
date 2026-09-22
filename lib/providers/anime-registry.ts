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

const providerTimeout = () => Math.min(15_000, Math.max(1_000, Number(process.env.ANIME_PROVIDER_TIMEOUT_MS) || 10_000))

const providerCatalog = [
  ['gogoanime', 'Anitaku', 'gogoanime', 1],
  ['zoro', 'Zoro', 'zoro', 2],
  ['animepahe', 'AnimePahe', 'animepahe', 3],
  ['kickassanime', 'KickAssAnime', 'kickassanime', 4],
] as const

export const ANIME_PROVIDERS: AnimeProviderConfig[] = providerCatalog.map(([id, name, providerParam, priority]) => ({
  id, name, type: 'consumet', baseUrl: '', providerParam, requiresReferer: true,
  supportsDub: true, supportsSub: true, priority, timeoutMs: providerTimeout(),
}))

export function getConfiguredAnimeProviders(): AnimeProviderConfig[] {
  const baseUrl = process.env.CONSUMET_BASE_URL?.trim() || ''
  const requested = (process.env.CONSUMET_ANIME_PROVIDERS || 'gogoanime,zoro,animepahe')
    .split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
  return ANIME_PROVIDERS
    .filter((provider) => baseUrl.length > 0 && requested.includes(provider.id))
    .map((provider) => ({ ...provider, baseUrl, priority: requested.indexOf(provider.id) + 1, timeoutMs: providerTimeout() }))
    .sort((a, b) => a.priority - b.priority)
}

export function getAnimeProvider(id: string): AnimeProviderConfig | undefined {
  return ANIME_PROVIDERS.find((provider) => provider.id === id)
}

export function providerOrigin(provider: AnimeProviderConfig): string | null {
  try { return new URL(provider.baseUrl).origin } catch { return null }
}

export const ANIME_TIMEOUT_MS = providerTimeout()

// Provider URLs are always operator configuration; no public fallback is used.
export const ANIME_PROVIDER_LEGAL_NOTICE = 'Anime playback providers are operator-configured. Understand the legal implications before enabling them.'

export default ANIME_PROVIDERS
