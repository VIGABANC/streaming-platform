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
  supportsMovie: boolean
  supportsTV: boolean
  qualityControl: 'provider-ui' | 'api' | 'none'
  observabilityTier: 'A' | 'B' | 'C'
  trustEligible: boolean
  capabilities: {
    autoplay: boolean
    subtitlePreference: boolean
    audioLanguagePreference: boolean
    startTimestamp: boolean
    customAccent: boolean
    controls: boolean
    readyEvents: boolean
    progressEvents: boolean
    completionEvents: boolean
    errorEvents: boolean
    qualityControl: 'provider-ui' | 'api' | 'none'
  }
  movieUrl: (id: number, options?: ProviderUrlOptions) => string
  tvUrl: (id: number, season: number, episode: number, options?: ProviderUrlOptions) => string
}

export interface ProviderUrlOptions {
  subtitleLanguage?: string
  autoplay?: boolean
  startTimestamp?: number
  customAccent?: string
  controls?: boolean
}

function appendProviderOptions(url: string, options?: ProviderUrlOptions, supported: (keyof ProviderUrlOptions)[] = []): string {
  if (!options) return url
  const params = new URLSearchParams()
  if (supported.includes('subtitleLanguage') && options.subtitleLanguage && options.subtitleLanguage !== 'auto') params.set('sub', options.subtitleLanguage)
  if (supported.includes('autoplay') && options.autoplay) params.set('autoplay', '1')
  if (supported.includes('startTimestamp') && options.startTimestamp && options.startTimestamp > 0) params.set('t', String(Math.floor(options.startTimestamp)))
  if (supported.includes('customAccent') && options.customAccent) params.set('color', options.customAccent.replace(/^#/, ''))
  if (supported.includes('controls') && options.controls === false) params.set('controls', '0')
  return params.size ? `${url}?${params.toString()}` : url
}

// ── Provider definitions ──────────────────────────────────────────────────────

export const PROVIDERS: StreamProvider[] = [
  {
    id: 'vidsrc-wiki',
    name: 'Server 1',
    badge: 'Configured',
    origin: 'https://v1.vidsrc.wiki',
    supportsMovie: true,
    supportsTV: true,
    qualityControl: 'none',
    observabilityTier: 'C',
    trustEligible: true,
    capabilities: {
      autoplay: true, subtitlePreference: true, audioLanguagePreference: false,
      startTimestamp: true, customAccent: true, controls: true, readyEvents: false,
      progressEvents: false, completionEvents: false, errorEvents: false, qualityControl: 'none',
    },
    movieUrl: (id, options) => appendProviderOptions(`https://v1.vidsrc.wiki/embed/movie/${id}/`, options, ['autoplay', 'subtitleLanguage', 'startTimestamp', 'customAccent', 'controls']),
    tvUrl: (id, season, episode, options) => appendProviderOptions(`https://v1.vidsrc.wiki/embed/tv/${id}/${season}/${episode}/`, options, ['autoplay', 'subtitleLanguage', 'startTimestamp', 'customAccent', 'controls']),
  },
  {
    id: 'vidsrc-xyz',
    name: 'Server 2',
    badge: 'Configured',
    origin: 'https://vidsrc.xyz',
    supportsMovie: true,
    supportsTV: true,
    qualityControl: 'none',
    observabilityTier: 'C',
    trustEligible: true,
    capabilities: {
      autoplay: false, subtitlePreference: false, audioLanguagePreference: false,
      startTimestamp: false, customAccent: false, controls: false, readyEvents: false,
      progressEvents: false, completionEvents: false, errorEvents: false, qualityControl: 'none',
    },
    movieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    tvUrl: (id, season, episode) => `https://vidsrc.xyz/embed/tv/${id}/${season}-${episode}`,
  },
  {
    id: '2embed',
    name: 'Server 3',
    badge: 'Configured',
    origin: 'https://www.2embed.cc',
    supportsMovie: true,
    supportsTV: true,
    qualityControl: 'none',
    observabilityTier: 'C',
    trustEligible: true,
    capabilities: {
      autoplay: false, subtitlePreference: false, audioLanguagePreference: false,
      startTimestamp: false, customAccent: false, controls: false, readyEvents: false,
      progressEvents: false, completionEvents: false, errorEvents: false, qualityControl: 'none',
    },
    movieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
    tvUrl: (id, season, episode) => `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
  },
  {
    id: 'autoembed',
    name: 'Server 4',
    badge: 'Configured',
    origin: 'https://player.autoembed.cc',
    supportsMovie: true,
    supportsTV: true,
    qualityControl: 'none',
    observabilityTier: 'C',
    trustEligible: true,
    capabilities: {
      autoplay: false, subtitlePreference: false, audioLanguagePreference: false,
      startTimestamp: false, customAccent: false, controls: false, readyEvents: false,
      progressEvents: false, completionEvents: false, errorEvents: false, qualityControl: 'none',
    },
    movieUrl: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tvUrl: (id, season, episode) => `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`,
  },
]

/** Default provider in the allowlisted provider registry. */
export const DEFAULT_PROVIDER = PROVIDERS[0].id

export function isProviderEligible(provider: StreamProvider): boolean {
  return provider.trustEligible && provider.origin.startsWith('https://')
}

export function getInitialProviderId(savedProvider?: string): string {
  return savedProvider && PROVIDERS.some((provider) => provider.id === savedProvider)
    ? savedProvider
    : DEFAULT_PROVIDER
}

export function getPlayerProvider(): string {
  return PROVIDERS[0].origin
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
  if (!isStrictPositiveInteger(value)) {
    throw new Error(`INVALID_${label.toUpperCase()}`)
  }
  return Number(value)
}

export function isStrictPositiveInteger(value: string | number): boolean {
  return (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) ||
    (typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)))
}

export interface ProviderHealth {
  providerId?: string
  attempts: number
  successes: number
  failures?: number
  timeouts?: number
  consecutiveFailures?: number
  successEWMA?: number
  startupLatencyEWMA?: number
  lastAttemptAt?: number
  lastSuccessAt?: number
  lastFailureAt?: number
  updatedAt?: number
  halfOpenTrialAt?: number
  cooldownUntil?: number
  circuit?: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

export const PLAYER_HEALTH_STORAGE_KEY = 'veyra-player-health-v1'
const HEALTH_TTL_MS = 30 * 24 * 60 * 60 * 1000
const COOLDOWNS_MS = [60_000, 5 * 60_000, 15 * 60_000]

export function isProviderAvailable(health: Partial<ProviderHealth>, now = Date.now()): boolean {
  if (health.circuit === 'OPEN' && (health.cooldownUntil ?? 0) > now) return false
  if (health.circuit === 'HALF_OPEN' && health.halfOpenTrialAt != null) return false
  return true
}

export function emptyProviderHealth(providerId?: string): ProviderHealth {
  return {
    providerId,
    attempts: 0,
    successes: 0,
    failures: 0,
    timeouts: 0,
    consecutiveFailures: 0,
    successEWMA: 0.5,
    circuit: 'CLOSED',
  }
}

export function readProviderHealth(now = Date.now()): Record<string, ProviderHealth> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(PLAYER_HEALTH_STORAGE_KEY)
    if (!raw) return {}
    const stored = JSON.parse(raw) as Record<string, ProviderHealth & { updatedAt?: number }>
    return Object.fromEntries(Object.entries(stored)
      .filter(([, value]) => !value.updatedAt || now - value.updatedAt < HEALTH_TTL_MS)
      .map(([id, value]) => [id, {
        ...emptyProviderHealth(id),
        ...value,
        circuit: value.cooldownUntil && value.cooldownUntil > now
          ? 'OPEN'
          : value.cooldownUntil
            ? 'HALF_OPEN'
            : 'CLOSED',
      }]))
  } catch {
    return {}
  }
}

function writeProviderHealth(health: Record<string, ProviderHealth>): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(PLAYER_HEALTH_STORAGE_KEY, JSON.stringify(health)) } catch { /* storage is optional */ }
}

export function recordProviderAttempt(providerId: string, now = Date.now()): ProviderHealth {
  const all = readProviderHealth(now)
  const current = all[providerId] ?? emptyProviderHealth(providerId)
  const circuit = current.cooldownUntil && current.cooldownUntil <= now ? 'HALF_OPEN' as const : current.circuit ?? 'CLOSED' as const
  const next = { ...current, attempts: current.attempts + 1, lastAttemptAt: now, updatedAt: now, circuit, halfOpenTrialAt: circuit === 'HALF_OPEN' ? now : current.halfOpenTrialAt }
  all[providerId] = next
  writeProviderHealth(all)
  return next
}

export function recordProviderSuccess(providerId: string, startupLatency: number, now = Date.now()): ProviderHealth {
  const all = readProviderHealth(now)
  const current = all[providerId] ?? emptyProviderHealth(providerId)
  const alpha = 0.35
  const latency = current.startupLatencyEWMA == null ? startupLatency : alpha * startupLatency + (1 - alpha) * current.startupLatencyEWMA
  const successEWMA = alpha * 1 + (1 - alpha) * (current.successEWMA ?? 0.5)
  const next = { ...current, successes: current.successes + 1, consecutiveFailures: 0, successEWMA, startupLatencyEWMA: latency, lastSuccessAt: now, updatedAt: now, cooldownUntil: undefined, halfOpenTrialAt: undefined, circuit: 'CLOSED' as const }
  all[providerId] = next
  writeProviderHealth(all)
  return next
}

export function recordProviderFailure(providerId: string, reason: 'timeout' | 'error', now = Date.now()): ProviderHealth {
  const all = readProviderHealth(now)
  const current = all[providerId] ?? emptyProviderHealth(providerId)
  const consecutiveFailures = (current.consecutiveFailures ?? 0) + 1
  const cooldownUntil = consecutiveFailures >= 2 ? now + COOLDOWNS_MS[Math.min(consecutiveFailures - 2, COOLDOWNS_MS.length - 1)] : undefined
  const next = { ...current, failures: (current.failures ?? 0) + 1, timeouts: (current.timeouts ?? 0) + (reason === 'timeout' ? 1 : 0), consecutiveFailures, successEWMA: 0.65 * (current.successEWMA ?? 0.5), lastFailureAt: now, updatedAt: now, halfOpenTrialAt: undefined, cooldownUntil, circuit: cooldownUntil ? 'OPEN' as const : 'CLOSED' as const }
  all[providerId] = next
  writeProviderHealth(all)
  return next
}

export function rankProviders(options: {
  health?: Record<string, ProviderHealth>
  attemptedProviderIds?: string[]
  preferredProviderId?: string
  now?: number
} = {}): StreamProvider[] {
  const attempted = new Set(options.attemptedProviderIds ?? [])
  const now = options.now ?? Date.now()
  return PROVIDERS
    .filter(isProviderEligible)
    .filter((provider) => !attempted.has(provider.id))
    .filter((provider) => isProviderAvailable(options.health?.[provider.id] ?? emptyProviderHealth(provider.id), now))
    .map((provider, index) => {
      const health = options.health?.[provider.id] ?? emptyProviderHealth(provider.id)
      const reliability = health.successEWMA ?? (health.successes + 2) / (health.attempts + 4)
      const latency = health.startupLatencyEWMA ?? 10_000
      const latencyScore = 1 - Math.min(latency, 10_000) / 10_000
      const preference = provider.id === options.preferredProviderId ? 0.05 : 0
      const exploration = health.attempts === 0 ? 0.05 : 0
      return { provider, score: reliability * 0.55 + latencyScore * 0.25 + preference + exploration - index * 0.0001 }
    })
    .sort((a, b) => b.score - a.score)
    .map(({ provider }) => provider)
}

export function getMovieEmbedUrl(id: string | number, providerId: string = 'vidsrc-wiki', options?: ProviderUrlOptions): string {
  const safeId = positiveInteger(id, 'MEDIA_ID')
  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  return provider.movieUrl(safeId, options)
}

export function getTVEmbedUrl(
  id: string | number,
  season: string | number,
  episode: string | number,
  providerId: string = 'vidsrc-wiki',
  options?: ProviderUrlOptions,
): string {
  const safeId = positiveInteger(id, 'MEDIA_ID')
  const safeSeason = positiveInteger(season, 'SEASON')
  const safeEpisode = positiveInteger(episode, 'EPISODE')
  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0]
  return provider.tvUrl(safeId, safeSeason, safeEpisode, options)
}

// ── Network & warmup ──────────────────────────────────────────────────────────

/**
 * Add DNS-prefetch and preconnect hints for the embed providers.
 * Safe to call multiple times — deduplicates via attribute query.
 */
export function warmPlayerConnection(providerId?: string): void {
  if (typeof document === 'undefined') return

  const origins = providerId
    ? PROVIDERS.filter((provider) => provider.id === providerId).map((provider) => provider.origin)
    : []

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

export function startupDeadlineMs(): number {
  if (typeof navigator === 'undefined') return 8_000
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection
  if (connection?.saveData || connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return 12_000
  if (connection?.effectiveType === '3g') return 10_000
  return 8_000
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
