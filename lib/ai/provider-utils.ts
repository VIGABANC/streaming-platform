import { parseNormalizedFeedback } from '@/lib/feedback/normalize'
import type { NormalizedFeedback, SanitizedFeedback } from '@/lib/feedback/types'
import { AIProviderError, type AIProvider, type AIProviderContext, type AIProviderId } from './types'

type FetchLike = typeof fetch

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function buildNormalizationPrompt(input: SanitizedFeedback): string {
  return [
    'Product: VEYRA. Framework: Next.js. Language: TypeScript. Styling: Tailwind. Data source: TMDB.',
    'Return JSON only matching the normalized feedback schema. Use only user-provided facts; put uncertain ideas in suspected_areas or missing_information.',
    'Never invent routes, browsers, screenshots, root causes, API responses, console errors, or reproduction success.',
    JSON.stringify(input),
  ].join('\n')
}

function retryAfterMs(headers: Headers): number | null {
  const headerObject = headers as unknown as Record<string, unknown>
  const value = typeof headers?.get === 'function'
    ? headers.get('retry-after')
    : typeof headerObject['retry-after'] === 'string'
      ? headerObject['retry-after']
      : typeof headerObject['Retry-After'] === 'string'
        ? headerObject['Retry-After']
        : Object.entries(headerObject).find(([key]) => key.toLowerCase() === 'retry-after')?.[1] as string | undefined ?? null
  if (!value) return null
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null
}

export async function requestJson(fetchImpl: FetchLike, url: string, init: RequestInit, context: AIProviderContext): Promise<unknown> {
  let response: Response
  try {
    response = await fetchImpl(url, { ...init, signal: context.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AIProviderError('timeout', 'Provider request timed out')
    }
    throw new AIProviderError('temporary', 'Provider request failed')
  }

  if (!response.ok) {
    const kind = response.status === 401 || response.status === 403
      ? 'auth'
      : response.status === 429
        ? 'rate_limit'
        : response.status === 408 || response.status >= 500
          ? 'temporary'
          : 'invalid_response'
    throw new AIProviderError(kind, `Provider request returned ${response.status}`, {
      status: response.status,
      retryAfterMs: retryAfterMs(response.headers) ?? undefined,
    })
  }

  try {
    return await response.json()
  } catch {
    throw new AIProviderError('invalid_response', 'Provider returned invalid JSON', { status: response.status })
  }
}

function chatBody(value: unknown): string {
  const body = record(value)
  const choices = Array.isArray(body.choices) ? body.choices : []
  const first = record(choices[0])
  const message = record(first.message)
  const content = typeof message.content === 'string' ? message.content : null
  if (!content) throw new AIProviderError('invalid_response', 'Provider response did not contain message content')
  return content
}

export function createChatProvider(options: {
  id: AIProviderId
  apiKey: string
  model: string
  endpoint: string
  fetchImpl?: FetchLike
  headers?: Record<string, string>
}): AIProvider {
  return {
    id: options.id,
    model: options.model,
    supportsJson: true,
    async normalize(input: SanitizedFeedback, context: AIProviderContext): Promise<NormalizedFeedback> {
      const value = await requestJson(options.fetchImpl ?? fetch, options.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify({
          model: options.model,
          messages: [
            { role: 'system', content: 'You normalize VEYRA feedback into strict JSON.' },
            { role: 'user', content: buildNormalizationPrompt(input) },
          ],
          temperature: 0,
          max_tokens: 1_200,
          response_format: { type: 'json_object' },
        }),
      }, context)
      return parseNormalizedFeedback(chatBody(value), input)
    },
  }
}

export function textFromResponse(value: unknown, candidates: string[]): string {
  let current: unknown = value
  for (const key of candidates) {
    const object = record(current)
    current = object[key]
  }
  if (typeof current === 'string' && current.trim()) return current
  throw new AIProviderError('invalid_response', 'Provider response did not contain text')
}
