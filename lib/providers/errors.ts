export const PLAYBACK_ERROR_COPY = {
  'sandbox-blocked': 'This server did not start. Trying another…',
  'empty-response': 'This server returned no source. Trying another…',
  'no-sources': 'This title is not on this server. Trying another…',
  timeout: 'This server timed out. Trying another…',
  'dns-failure': "This server's domain cannot be resolved.",
  'all-failed': 'Playback unavailable — tried all servers.',
  'rate-limited': 'Too many attempts. Wait a few seconds and retry.',
  'csp-blocked': 'This server is blocked by security policy.',
} as const

export type PlaybackErrorReason = keyof typeof PLAYBACK_ERROR_COPY

export function playbackErrorCopy(reason: PlaybackErrorReason): string {
  return PLAYBACK_ERROR_COPY[reason]
}

export function isPlaybackErrorReason(value: string): value is PlaybackErrorReason {
  return value in PLAYBACK_ERROR_COPY
}

export function playbackErrorCopyForPlayer(code: string): string {
  switch (code) {
    case 'PLAYER_TIMEOUT': return PLAYBACK_ERROR_COPY.timeout
    case 'EMBED_BLOCKED': return PLAYBACK_ERROR_COPY['sandbox-blocked']
    case 'STREAM_UNAVAILABLE': return PLAYBACK_ERROR_COPY['all-failed']
    default: return 'This server could not start playback. Trying another…'
  }
}

export const PLAYBACK_ERROR_REASONS = Object.keys(PLAYBACK_ERROR_COPY) as PlaybackErrorReason[]
