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
