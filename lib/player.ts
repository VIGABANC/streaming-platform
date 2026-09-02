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
  movieUrl: (id: number) => string
  tvUrl: (id: number, season: number, episode: number) => string
}

// ── Provider definitions ──────────────────────────────────────────────────────

export const PROVIDERS: StreamProvider[] = [
  {
    id: 'vidsrc-wiki',
    name: 'Server 1 (VidSrc Pro)',
    badge: 'Fast HD',
    movieUrl: (id) => `https://v1.vidsrc.wiki/embed/movie/${id}/`,
    tvUrl: (id, season, episode) => `https://v1.vidsrc.wiki/embed/tv/${id}/${season}/${episode}/`,
  },
  {
    id: 'vidsrc-xyz',
    name: 'Server 2 (VidSrc Prime)',
    badge: 'Ultra HD',
    movieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    tvUrl: (id, season, episode) => `https://vidsrc.xyz/embed/tv/${id}/${season}-${episode}`,
  },
  {
    id: '2embed',
    name: 'Server 3 (2Embed)',
    badge: 'Multi-Sub',
    movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    tvUrl: (id, season, episode) => `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  {
    id: 'autoembed',
    name: 'Server 4 (AutoEmbed)',
    badge: 'Auto Fallback',
    movieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tvUrl: (id, season, episode) => `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`,
  },
]

/** Default provider if NEXT_PUBLIC_EMBED_PROVIDER is not set */
export const DEFAULT_PROVIDER = PROVIDERS[0].id

export function getPlayerProvider(): string {
  const raw = process.env.NEXT_PUBLIC_EMBED_PROVIDER
  if (!raw) return 'https://v1.vidsrc.wiki'
  try {
    const parsed = new URL(raw)
    // Allow https or local development http://localhost
    if (
      parsed.protocol === 'https:' ||
      (process.env.NODE_ENV === 'development' && parsed.hostname === 'localhost')
    ) {
      return parsed.origin
    }
  } catch {
    // Malformed URL
  }
  return 'https://v1.vidsrc.wiki'
}

export function getPlayerOrigin(): string {
  try {
    return new URL(getPlayerProvider()).origin
  } catch {
    return 'https://v1.vidsrc.wiki'
  }
}

// ── URL builders ──────────────────────────────────────────────────────────────

function positiveInteger(value: string | number, label: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`INVALID_${label.toUpperCase()}`)
  }
  return n
}

export function getMovieEmbedUrl(id: string | number, providerId: string = 'vidsrc-wiki'): string {
  const safeId = positiveInteger(id, 'MEDIA_ID')
  const customBase = process.env.NEXT_PUBLIC_EMBED_PROVIDER
  if (customBase && providerId === 'vidsrc-wiki') {
    return `${customBase.replace(/\/$/, '')}/embed/movie/${safeId}/`
  }
  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  return provider.movieUrl(safeId)
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
  const customBase = process.env.NEXT_PUBLIC_EMBED_PROVIDER
  if (customBase && providerId === 'vidsrc-wiki') {
    return `${customBase.replace(/\/$/, '')}/embed/tv/${safeId}/${safeSeason}/${safeEpisode}/`
  }
  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  return provider.tvUrl(safeId, safeSeason, safeEpisode)
}

// ── Network & warmup ──────────────────────────────────────────────────────────

/**
 * Add DNS-prefetch and preconnect hints for the embed providers.
 * Safe to call multiple times — deduplicates via attribute query.
 */
export function warmPlayerConnection(): void {
  if (typeof document === 'undefined') return

  const origins = [
    'https://v1.vidsrc.wiki',
    'https://vidsrc.xyz',
    'https://www.2embed.cc',
    'https://player.autoembed.cc',
  ]

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
