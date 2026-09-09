import { track } from '@vercel/analytics'

function pathWithoutQuery(): string {
  return typeof window === 'undefined' ? '/' : window.location.pathname
}

export function reportWebVital(metric: string, value: number): void {
  if (typeof window === 'undefined' || !Number.isFinite(value)) return
  void track('veyra_web_vital', {
    metric,
    value: Math.round(value * 100) / 100,
    path: pathWithoutQuery(),
  })
}

export function reportClientError(source: 'error' | 'unhandledrejection'): void {
  if (typeof window === 'undefined') return
  void track('veyra_client_error', { source, path: pathWithoutQuery() })
}

export type PlayerEventName =
  | 'player_attempt'
  | 'player_frame_loaded'
  | 'player_timeout'
  | 'player_error'
  | 'player_auto_failover'
  | 'player_manual_switch'
  | 'player_provider_success'
  | 'player_all_providers_exhausted'

export function reportPlayerEvent(
  event: PlayerEventName,
  data: { providerId: string; mediaType: 'movie' | 'tv'; startupMs?: number; attemptIndex?: number; errorCategory?: string; networkHint?: string },
): void {
  if (typeof window === 'undefined') return
  void track(`veyra_${event}`, { ...data, path: pathWithoutQuery() })
}
