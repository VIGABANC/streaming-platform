// ─────────────────────────────────────────────────────────────────────────────
// Player configuration — multi-provider fallback embed engine
// ─────────────────────────────────────────────────────────────────────────────

export type PlayerMode = 'external-embed'

export type PlayerErrorCode =
  | 'PROVIDER_LOAD_ERROR'
  | 'PLAYER_TIMEOUT'
  | 'NETWORK_OFFLINE'
  | 'STREAM_UNAVAILABLE'
  | 'INVALID_MEDIA_ID'
  | 'INVALID_EPISODE'
  | 'EMBED_BLOCKED'
  | 'UNKNOWN'

export interface PlaybackTelemetry {
  playRequestTime: number
  playerReadyTime?: number
  startupDelay?: number
  retryCount: number
  mediaType: 'movie' | 'tv'
  provider: string
  networkHint?: string
  errorCode?: PlayerErrorCode
}

export interface StreamProvider {
  id: string
  name: string
  badge: string
  origin: string
  movieUrl: (id: number) => string
  tvUrl: (id: number, season: number, episode: number) => string
}

export const PLAYER_ORIGINS = {
  'vidsrc-wiki': 'https://v1.vidsrc.wiki',
  'vidsrc-xyz': 'https://vidsrc.xyz',
  '2embed': 'https://www.2embed.cc',
  autoembed: 'https://player.autoembed.cc',
} as const

// ── Provider definitions ──────────────────────────────────────────────────────

export const PROVIDERS: StreamProvider[] = [
  {
    id: 'vidsrc-wiki',
    name: 'Server 1',
    badge: 'Fast HD',
    origin: PLAYER_ORIGINS['vidsrc-wiki'],
    movieUrl: (id) => `https://v1.vidsrc.wiki/embed/movie/${id}/`,
    tvUrl: (id, season, episode) => `https://v1.vidsrc.wiki/embed/tv/${id}/${season}/${episode}/`,
  },
  {
    id: 'vidsrc-xyz',
    name: 'Server 2',
    badge: 'Ultra HD',
    origin: PLAYER_ORIGINS['vidsrc-xyz'],
    movieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    tvUrl: (id, season, episode) => `https://vidsrc.xyz/embed/tv/${id}/${season}-${episode}`,
  },
  {
    id: '2embed',
    name: 'Server 3',
    badge: 'Multi-Sub',
    origin: PLAYER_ORIGINS['2embed'],
    movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    tvUrl: (id, season, episode) => `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  {
    id: 'autoembed',
    name: 'Server 4',
    badge: 'Auto Fallback',
    origin: PLAYER_ORIGINS.autoembed,
    movieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tvUrl: (id, season, episode) => `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`,
  },
]

export const DEFAULT_PROVIDER = PROVIDERS[0].id

export function getInitialProviderId(savedProvider?: string): string {
  return savedProvider && PROVIDERS.some((provider) => provider.id === savedProvider)
    ? savedProvider
    : DEFAULT_PROVIDER
}

// ── URL builders ──────────────────────────────────────────────────────────────

function positiveInteger(value: string | number, label: string): number {
  const raw = String(value)
  const n = Number(raw)
  if (!/^\d+$/.test(raw) || raw.length > 1 && raw.startsWith('0') || !Number.isSafeInteger(n) || n < 1) {
    throw new Error(`INVALID_${label.toUpperCase()}`)
  }
  return n
}

export function isTrustedPlayerUrl(value: string, providerId: string): boolean {
  const provider = PROVIDERS.find((candidate) => candidate.id === providerId)
  if (!provider) return false
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.origin !== provider.origin || url.search || url.hash) return false
    const path = url.pathname.replace(/\/$/, '')
    if (providerId === 'vidsrc-wiki') return /^\/embed\/(movie|tv)\/\d+(?:\/\d+\/\d+)?$/.test(path)
    if (providerId === 'vidsrc-xyz') return /^\/embed\/(movie\/\d+|tv\/\d+\/\d+-\d+)$/.test(path)
    if (providerId === '2embed') return /^\/embed\/\d+$/.test(path) || /^\/embedtv\/\d+&s=\d+&e=\d+$/.test(path)
    return /^\/embed\/(movie\/\d+|tv\/\d+\/\d+\/\d+)$/.test(path)
  } catch {
    return false
  }
}

function trustedUrl(url: string, providerId: string): string {
  if (!isTrustedPlayerUrl(url, providerId)) throw new Error('UNTRUSTED_PLAYER_URL')
  return url
}

export function getMovieEmbedUrl(id: string | number, providerId: string = 'vidsrc-wiki'): string {
  const safeId = positiveInteger(id, 'MEDIA_ID')
  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  return trustedUrl(provider.movieUrl(safeId), provider.id)
}

export function getTVEmbedUrl(
  id: string | number,
  season: string | number,
  episode: string | number,
  providerId: string = 'vidsrc-wiki',
): string {
  const safeId = positiveInteger(id, 'MEDIA_ID')
  const safeSeason = positiveInteger(season, 'SEASON')
  const safeEpisode = positiveInteger(episode, 'EPISODE')
  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  return trustedUrl(provider.tvUrl(safeId, safeSeason, safeEpisode), provider.id)
}

// ── Network & warmup ──────────────────────────────────────────────────────────

/**
 * Add DNS-prefetch and preconnect hints for the embed providers.
 * Safe to call multiple times — deduplicates via attribute query.
 */
export function warmPlayerConnection(providerId?: string): void {
  if (typeof document === 'undefined') return

  const originsByProvider: Record<string, string> = {
    'vidsrc-wiki': 'https://v1.vidsrc.wiki',
    'vidsrc-xyz': 'https://vidsrc.xyz',
    '2embed': 'https://www.2embed.cc',
    autoembed: 'https://player.autoembed.cc',
  }
  const origins = providerId && originsByProvider[providerId] ? [originsByProvider[providerId]] : []

  const addHint = (origin: string, rel: 'preconnect' | 'dns-prefetch', crossOrigin = false) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${origin}"]`)) return
    const link = document.createElement('link')
    link.rel = rel
    link.href = origin
    if (crossOrigin) link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }

  for (const origin of origins) {
    addHint(origin, 'dns-prefetch')
    addHint(origin, 'preconnect', true)
  }
}

export function networkHint(): string | undefined {
  if (typeof navigator === 'undefined') return undefined
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean }
  }
  const c = nav.connection
  return c ? `${c.effectiveType ?? 'unknown'}${c.saveData ? ':save-data' : ''}` : undefined
}

// ── Error messages ────────────────────────────────────────────────────────────

export const playerErrorMessages: Record<PlayerErrorCode, string> = {
  PROVIDER_LOAD_ERROR: 'The playback stream failed to load. Try switching to a different server above.',
  PLAYER_TIMEOUT: 'Playback is taking longer than expected. We can switch servers automatically.',
  NETWORK_OFFLINE: "You're offline. Playback will resume when your connection returns.",
  STREAM_UNAVAILABLE: 'This title is not currently available on this server.',
  INVALID_MEDIA_ID: 'This media ID is not valid.',
  INVALID_EPISODE: 'This episode does not exist.',
  EMBED_BLOCKED: 'The embed was blocked. Try switching servers or disabling ad-blocker strict rules.',
  UNKNOWN: 'An unknown playback error occurred.',
}

export function playerErrorMessage(code: PlayerErrorCode): string {
  return playerErrorMessages[code] ?? playerErrorMessages.UNKNOWN
}
