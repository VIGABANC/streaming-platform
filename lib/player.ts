export type PlayerMode = 'external-embed' | 'native-stream'

export type PlaybackTelemetry = {
  playRequestTime: number
  playerReadyTime?: number
  startupDelay?: number
  retryCount: number
  mediaType: 'movie' | 'tv'
  provider: string
  networkHint?: string
}

const DEFAULT_PROVIDER = 'https://vidsrc.wiki'

function positiveInteger(value: string | number, label: string) {
  const numberValue = Number(value)
  if (!Number.isInteger(numberValue) || numberValue < 1) throw new Error(`INVALID_${label.toUpperCase()}`)
  return numberValue
}

export function getPlayerProvider() {
  return process.env.NEXT_PUBLIC_EMBED_PROVIDER || DEFAULT_PROVIDER
}

export function getPlayerOrigin() {
  return new URL(getPlayerProvider()).origin
}

export function getMovieEmbedUrl(id: string | number) {
  return `${getPlayerProvider()}/embed/movie/${positiveInteger(id, 'tmdb_id')}/`
}

export function getTVEmbedUrl(id: string | number, season: string | number, episode: string | number) {
  return `${getPlayerProvider()}/embed/tv/${positiveInteger(id, 'tmdb_id')}/${positiveInteger(season, 'season')}/${positiveInteger(episode, 'episode')}/`
}

export function warmPlayerConnection() {
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

export function networkHint() {
  if (typeof navigator === 'undefined') return undefined
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection
  return connection ? `${connection.effectiveType || 'unknown'}${connection.saveData ? ':save-data' : ''}` : undefined
}

export const playerErrors = {
  timeout: 'PLAYER_TIMEOUT',
  offline: 'NETWORK_OFFLINE',
  invalid: 'INVALID_MEDIA_ID',
  provider: 'PROVIDER_LOAD_ERROR',
} as const

export function playerErrorMessage(code: keyof typeof playerErrors) {
  return code === 'offline' ? "You're offline. Playback will resume when your connection returns." : 'Playback is taking longer than expected.'
}

export { DEFAULT_PROVIDER }
