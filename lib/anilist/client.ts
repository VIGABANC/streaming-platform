export const ANILIST_ENDPOINT = 'https://graphql.anilist.co'
const MAX_RESPONSE_BYTES = 2_000_000

export type AniListErrorCode = 'INVALID_ID' | 'NETWORK_ERROR' | 'TIMEOUT' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'INVALID_RESPONSE' | 'NOT_FOUND'

export class AniListError extends Error {
  constructor(public readonly code: AniListErrorCode, message: string = code) {
    super(message)
    this.name = 'AniListError'
  }
}

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message?: string }>
}

export function assertAniListId(id: number): number {
  if (!Number.isSafeInteger(id) || id < 1 || id > 2_000_000_000) throw new AniListError('INVALID_ID', 'AniList ID must be a positive integer')
  return id
}

export async function anilistGraphql<T>(query: string, variables: Record<string, unknown>, revalidate: number): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8_000)
  let response: Response
  try {
    response = await fetch(ANILIST_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new AniListError('TIMEOUT', 'AniList request timed out')
    throw new AniListError('NETWORK_ERROR', 'Unable to reach AniList')
  } finally {
    clearTimeout(timer)
  }

  if (response.status === 429) throw new AniListError('RATE_LIMITED', 'AniList rate limit reached')
  if (!response.ok) throw new AniListError('UPSTREAM_ERROR', `AniList returned ${response.status}`)

  let raw: string
  try {
    raw = await response.text()
    if (raw.length > MAX_RESPONSE_BYTES) throw new Error('response too large')
  } catch {
    throw new AniListError('INVALID_RESPONSE', 'AniList returned an unreadable response')
  }

  let payload: GraphQLResponse<T>
  try {
    payload = JSON.parse(raw) as GraphQLResponse<T>
  } catch {
    throw new AniListError('INVALID_RESPONSE', 'AniList returned invalid JSON')
  }
  if (payload.errors?.length) throw new AniListError('UPSTREAM_ERROR', payload.errors[0]?.message || 'AniList GraphQL error')
  if (!payload.data) throw new AniListError('INVALID_RESPONSE', 'AniList response did not include data')
  return payload.data
}
