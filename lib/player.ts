// ─────────────────────────────────────────────────────────────────────────────
// Player configuration — centralised embed URL factory
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

// ── Provider config ───────────────────────────────────────────────────────────

/** Default provider if NEXT_PUBLIC_EMBED_PROVIDER is not set */
export const DEFAULT_PROVIDER = 'https://v1.vidsrc.wiki'

export function getPlayerProvider(): string {
  // NEXT_PUBLIC_ prefix means it is accessible client-side; only the base URL
  // is exposed — no secrets are leaked via this env var.
  return process.env.NEXT_PUBLIC_EMBED_PROVIDER || DEFAULT_PROVIDER
}

export function getPlayerOrigin(): string {
  try {
    return new URL(getPlayerProvider()).origin
  } catch {
    return new URL(DEFAULT_PROVIDER).origin
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

export function getMovieEmbedUrl(id: string | number): string {
  const safeId = positiveInteger(id, 'MEDIA_ID')
  return `${getPlayerProvider()}/embed/movie/${safeId}/`
}

export function getTVEmbedUrl(
  id: string | number,
  season: string | number,
  episode: string | number,
): string {
  const safeId = positiveInteger(id, 'MEDIA_ID')
  const safeSeason = positiveInteger(season, 'SEASON')
  const safeEpisode = positiveInteger(episode, 'EPISODE')
  return `${getPlayerProvider()}/embed/tv/${safeId}/${safeSeason}/${safeEpisode}/`
}

// ── Network & warmup ──────────────────────────────────────────────────────────

/**
 * Add DNS-prefetch and preconnect hints for the embed provider.
 * Safe to call multiple times — deduplicates via attribute query.
 */
export function warmPlayerConnection(): void {
  if (typeof document === 'undefined') return
  const origin = getPlayerOrigin()

  const addHint = (rel: 'preconnect' | 'dns-prefetch', crossOrigin = false) => {
    if (document.head.querySelector(`link[rel="${rel}"][href="${origin}"]`)) return
    const link = document.createElement('link')
    link.rel = rel
    link.href = origin
    if (crossOrigin) link.crossOrigin = 'anonymous'
    document.head.appendChild(link)
  }

  addHint('dns-prefetch')
  addHint('preconnect', true)
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
  PROVIDER_LOAD_ERROR: 'The playback provider failed to load. Please try again.',
  PLAYER_TIMEOUT: 'Playback is taking longer than expected.',
  NETWORK_OFFLINE: "You're offline. Playback will resume when your connection returns.",
  STREAM_UNAVAILABLE: 'This title is not currently available for streaming.',
  INVALID_MEDIA_ID: 'This media ID is not valid.',
  INVALID_EPISODE: 'This episode does not exist.',
  EMBED_BLOCKED: 'The embed was blocked. Try a different browser or disable extensions.',
  UNKNOWN: 'An unknown error occurred.',
}

export function playerErrorMessage(code: PlayerErrorCode): string {
  return playerErrorMessages[code] ?? playerErrorMessages.UNKNOWN
}
