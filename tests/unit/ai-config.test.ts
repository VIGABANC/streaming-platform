import { describe, expect, it } from 'vitest'
import {
  createConfiguredProviders,
  getAIConfig,
} from '@/lib/ai/config'
import { createGroqProvider } from '@/lib/ai/providers/groq'
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

  it('does not enable optional providers when paid use is disabled', () => {
    const config = getAIConfig({ CEREBRAS_API_KEY: 'c', NVIDIA_API_KEY: 'n', AI_ZERO_COST_ONLY: 'false', ALLOW_PAID_AI: 'false' })
    expect(createConfiguredProviders(config, fetch).map((provider) => provider.id)).not.toContain('cerebras')
    expect(createConfiguredProviders(config, fetch).map((provider) => provider.id)).not.toContain('nvidia')
  })
})
