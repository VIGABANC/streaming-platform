import { describe, expect, it } from 'vitest'
import {
  createConfiguredProviders,
  getAIConfig,
} from '@/lib/ai/config'
import { createGeminiProvider } from '@/lib/ai/providers/gemini'
import { createGroqProvider } from '@/lib/ai/providers/groq'
import { deterministicFallback } from '@/lib/feedback/normalize'
import type { SanitizedFeedback } from '@/lib/feedback/types'

const input: SanitizedFeedback = {
  description: 'Playback fails.',
  type: 'bug',
  category: 'playback',
  severity: 'P1',
  route: '/watch/movie/42',
  expectedBehavior: 'Video starts.',
  actualBehavior: 'Spinner remains.',
  environment: {},
}

describe('AI provider configuration', () => {
  it('only configures providers with credentials and uses the required free-first order', () => {
    const config = getAIConfig({
      GROQ_API_KEY: 'g',
      GEMINI_API_KEY: 'ga',
      ALLOW_PAID_AI: 'false',
      AI_ZERO_COST_ONLY: 'true',
    })

    expect(config.providerOrder.slice(0, 5)).toEqual(['groq', 'gemini', 'cloudflare', 'mistral', 'openrouter'])
    expect(createConfiguredProviders(config, fetch).map((provider) => provider.id)).toEqual(['groq', 'gemini'])
  })

  it('rejects a non-free OpenRouter model when zero-cost mode is enabled', () => {
    expect(() => getAIConfig({
      OPENROUTER_API_KEY: 'or',
      OPENROUTER_MODEL: 'paid/model',
      AI_ZERO_COST_ONLY: 'true',
    })).toThrow(/free/i)
  })

  it('maps provider status codes to safe retry/auth failures', async () => {
    const provider = createGroqProvider({
      apiKey: 'key',
      model: 'model',
      fetchImpl: async () => ({
        ok: false,
        status: 429,
        headers: { get: (name: string) => name.toLowerCase() === 'retry-after' ? '4' : null },
      } as Response),
    })

    await expect(provider.normalize(input, { signal: new AbortController().signal }))
      .rejects.toMatchObject({ kind: 'rate_limit', retryAfterMs: 4000 })
  })

  it('uses Groq strict JSON Schema mode for gpt-oss-20b', async () => {
    let requestBody: Record<string, unknown> = {}
    const provider = createGroqProvider({
      apiKey: 'key',
      model: 'openai/gpt-oss-20b',
      fetchImpl: async (_url, init) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ choices: [{ message: { content: JSON.stringify(deterministicFallback(input)) } }] }),
        } as unknown as Response
      },
    })

    await expect(provider.normalize(input, { signal: new AbortController().signal })).resolves.toMatchObject({
      route: input.route,
      environment: input.environment,
    })

    expect(requestBody.response_format).toMatchObject({
      type: 'json_schema',
      json_schema: {
        name: 'veyra_feedback_enrichment',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: expect.arrayContaining(['title', 'summary', 'developer_prompt', 'confidence']),
        },
      },
    })
  })

  it('classifies a schema-invalid HTTP 200 response as invalid_response', async () => {
    const provider = createGroqProvider({
      apiKey: 'key',
      model: 'openai/gpt-oss-20b',
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({ choices: [{ message: { content: JSON.stringify({ title: 'Only a title' }) } }] }),
      } as unknown as Response),
    })

    await expect(provider.normalize(input, { signal: new AbortController().signal }))
      .rejects.toMatchObject({ kind: 'invalid_response' })
  })

  it('uses the current Gemini Interactions API JSON schema contract', async () => {
    let requestUrl = ''
    let requestHeaders: Record<string, string> = {}
    let requestBody: Record<string, unknown> = {}
    const provider = createGeminiProvider({
      apiKey: 'key',
      model: 'gemini-3.5-flash-lite',
      fetchImpl: async (url, init) => {
        requestUrl = String(url)
        requestHeaders = init?.headers as Record<string, string>
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({
            status: 'completed',
            steps: [{
              type: 'model_output',
              content: [{ type: 'text', text: JSON.stringify(deterministicFallback(input)) }],
            }],
          }),
        } as unknown as Response
      },
    })

    await expect(provider.normalize(input, { signal: new AbortController().signal })).resolves.toMatchObject({
      route: input.route,
      environment: input.environment,
    })

    expect(requestUrl).toBe('https://generativelanguage.googleapis.com/v1beta/interactions')
    expect(requestHeaders['x-goog-api-key']).toBe('key')
    expect(requestBody).toMatchObject({
      model: 'gemini-3.5-flash-lite',
      input: expect.any(String),
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          additionalProperties: false,
        },
      },
    })
  })

  it('retries without JSON mode when a provider rejects response_format', async () => {
    let calls = 0
    const provider = createGroqProvider({
      apiKey: 'key',
      model: 'model',
      fetchImpl: async (_url, init) => {
        calls += 1
        const body = JSON.parse(String(init?.body)) as { response_format?: unknown }
        if (body.response_format) {
          return { ok: false, status: 400, headers: { get: () => null } } as unknown as Response
        }
        return {
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ choices: [{ message: { content: JSON.stringify(deterministicFallback(input)) } }] }),
        } as unknown as Response
      },
    })

    await expect(provider.normalize(input, { signal: new AbortController().signal })).resolves.toMatchObject({ title: expect.any(String) })
    expect(calls).toBe(2)
  })

  it('does not enable optional providers when paid use is disabled', () => {
    const config = getAIConfig({ CEREBRAS_API_KEY: 'c', NVIDIA_API_KEY: 'n', AI_ZERO_COST_ONLY: 'false', ALLOW_PAID_AI: 'false' })
    expect(createConfiguredProviders(config, fetch).map((provider) => provider.id)).not.toContain('cerebras')
    expect(createConfiguredProviders(config, fetch).map((provider) => provider.id)).not.toContain('nvidia')
  })
})
