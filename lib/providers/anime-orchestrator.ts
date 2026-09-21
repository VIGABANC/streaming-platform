import 'server-only'
import { getConfiguredAnimeProviders, type AnimeProviderConfig } from './anime-registry'
import { recordFailure, recordSuccess } from './anime-health-store'

export interface AnimeSource { providerId: string; providerName: string; url: string; quality: string; isM3U8: boolean; headers?: Record<string, string> }
export interface AnimeSubtitle { providerId: string; url: string; lang: string }
export interface AnimeFetchResult { providerId: string; providerName: string; status: 'success' | 'failure'; sources: AnimeSource[]; subtitles: AnimeSubtitle[]; error?: string; latencyMs: number }

function absoluteUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : null } catch { return null }
}

async function requestJson(url: string, provider: AnimeProviderConfig): Promise<Record<string, unknown>> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), provider.timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const payload: unknown = await response.json()
    if (!payload || typeof payload !== 'object') throw new Error('Invalid provider response')
    return payload as Record<string, unknown>
  } finally { clearTimeout(timer) }
}

async function fetchFromProvider(provider: AnimeProviderConfig, malId: string, episode: number, mode: 'sub' | 'dub'): Promise<AnimeFetchResult> {
  const started = Date.now()
  try {
    if (provider.type !== 'consumet') throw new Error('Direct provider adapter is not configured')
    const info = await requestJson(`${provider.baseUrl.replace(/\/$/, '')}/anime/mal/info?id=${encodeURIComponent(malId)}${provider.providerParam ? `&provider=${encodeURIComponent(provider.providerParam)}` : ''}`, provider)
    const episodes = Array.isArray(info.episodes) ? info.episodes : []
    const matching = episodes.find((entry) => entry && typeof entry === 'object' && Number((entry as Record<string, unknown>).number) === episode) as Record<string, unknown> | undefined
    if (!matching || typeof matching.id !== 'string') throw new Error('Episode unavailable')
    const payload = await requestJson(`${provider.baseUrl.replace(/\/$/, '')}/anime/mal/watch/${encodeURIComponent(matching.id)}?provider=${encodeURIComponent(provider.providerParam ?? '')}&server=${mode}`, provider)
    const sources: AnimeSource[] = (Array.isArray(payload.sources) ? payload.sources : []).flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const value = entry as Record<string, unknown>
      const url = absoluteUrl(value.url)
      return url ? [{ providerId: provider.id, providerName: provider.name, url, quality: typeof value.quality === 'string' ? value.quality : 'auto', isM3U8: value.isM3U8 === true || /\.m3u8(?:\?|$)/i.test(url) }] : []
    })
    const subtitles: AnimeSubtitle[] = (Array.isArray(payload.subtitles) ? payload.subtitles : []).flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return []
      const value = entry as Record<string, unknown>
      const url = absoluteUrl(value.url)
      return url ? [{ providerId: provider.id, url, lang: typeof value.lang === 'string' ? value.lang : 'en' }] : []
    })
    if (!sources.length) throw new Error('No sources')
    const latencyMs = Date.now() - started
    recordSuccess(provider.id, latencyMs)
    return { providerId: provider.id, providerName: provider.name, status: 'success', sources, subtitles, latencyMs }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider request failed'
    recordFailure(provider.id, message)
    return { providerId: provider.id, providerName: provider.name, status: 'failure', sources: [], subtitles: [], error: message, latencyMs: Date.now() - started }
  }
}

export async function fetchFromAllProviders(malId: string | number, episode: number, options: { subOrDub?: 'sub' | 'dub' } = {}): Promise<AnimeFetchResult[]> {
  const providers = getConfiguredAnimeProviders().slice(0, 5)
  if (!providers.length) return []
  const results = await Promise.all(providers.map((provider) => fetchFromProvider(provider, String(malId), episode, options.subOrDub ?? 'sub')))
  return results.sort((a, b) => (a.status === b.status ? a.latencyMs - b.latencyMs : a.status === 'success' ? -1 : 1))
}
