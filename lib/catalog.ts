import { TMDBError } from './tmdb'

export type CatalogFailureCode =
  | 'CONFIGURATION'
  | 'AUTHENTICATION'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'INVALID_RESPONSE'
  | 'NOT_FOUND'
  | 'UNKNOWN'

export interface CatalogFailure {
  code: CatalogFailureCode
  message: string
}

export interface CatalogResult<T> {
  status: 'success' | 'empty' | 'failure'
  data: T | null
  error?: CatalogFailure
}

const PUBLIC_MESSAGES: Record<CatalogFailureCode, string> = {
  CONFIGURATION: 'The catalog is not connected in this environment.',
  AUTHENTICATION: 'The catalog is temporarily unavailable. Please try again.',
  RATE_LIMITED: 'The catalog is busy right now. Please try again shortly.',
  NETWORK: 'The catalog is temporarily unavailable. Please try again.',
  INVALID_RESPONSE: 'The catalog returned an invalid response. Please try again.',
  NOT_FOUND: 'That catalog item could not be found.',
  UNKNOWN: 'The catalog is temporarily unavailable. Please try again.',
}

function failureCode(error: unknown): CatalogFailureCode {
  if (!(error instanceof TMDBError)) return 'UNKNOWN'

  switch (error.code) {
    case 'TMDB_API_KEY_MISSING':
      return 'CONFIGURATION'
    case 'TMDB_AUTH_FAILED':
      return 'AUTHENTICATION'
    case 'TMDB_RATE_LIMITED':
      return 'RATE_LIMITED'
    case 'TMDB_NETWORK_ERROR':
      return 'NETWORK'
    case 'TMDB_INVALID_RESPONSE':
      return 'INVALID_RESPONSE'
    case 'TMDB_NOT_FOUND':
      return 'NOT_FOUND'
    default:
      return 'UNKNOWN'
  }
}

export function toCatalogFailure(error: unknown): CatalogFailure {
  const code = failureCode(error)
  return { code, message: PUBLIC_MESSAGES[code] }
}

export async function loadCatalog<T>(
  loader: () => Promise<T>,
  isEmpty: (data: T) => boolean = (data) => Array.isArray(data) && data.length === 0,
): Promise<CatalogResult<T>> {
  try {
    const data = await loader()
    return { status: isEmpty(data) ? 'empty' : 'success', data }
  } catch (error) {
    return { status: 'failure', data: null, error: toCatalogFailure(error) }
  }
}
