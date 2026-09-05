import { describe, expect, it } from 'vitest'
import { AIProviderError, type AIProvider } from '@/lib/ai/types'
import { createAIRouter } from '@/lib/ai/router'
import type { SanitizedFeedback } from '@/lib/feedback/types'

const input: SanitizedFeedback = {
  description: 'Playback fails.', type: 'bug', category: 'playback', severity: 'P1',
  route: '/watch/movie/42', expectedBehavior: 'Video starts.', actualBehavior: 'Spinner remains.', environment: {},
}

function testConfig(overrides: Record<string, number> = {}) {
  return {
    providerOrder: ['groq', 'gemini'] as const,
    providerTimeoutMs: 100,
    syncBudgetMs: 500,
    cooldownMs: 10_000,
    circuitFailureThreshold: 3,
    allowPaidAi: false,
    zeroCostOnly: true,
    models: { groq: 'groq-model', gemini: 'gemini-model', cloudflare: 'cf-model', mistral: 'mistral-model', openrouter: 'openrouter/free', cohere: 'cohere-model', huggingface: 'hf-model', cerebras: 'cerebras-model', nvidia: 'nvidia-model', deterministic: 'deterministic' },
    credentials: {},
    cloudflareAccountId: null,
    ...overrides,
  }
}

function succeeding(id: 'groq' | 'gemini'): AIProvider {
  return {
    id, model: `${id}-model`, supportsJson: true,
    normalize: async () => ({
      type: 'bug', title: 'Playback issue', category: 'playback', severity: 'P1', summary: 'Playback fails.',
      route: input.route, language: 'English', reproduction_steps: [], expected_behavior: input.expectedBehavior,
      actual_behavior: input.actualBehavior, environment: {}, suspected_areas: [], missing_information: [],
      acceptance_criteria: ['Fix playback.'], fix_plan: ['Reproduce.'], developer_prompt: 'Investigate.', confidence: 0.8,
    }),
  }
}

function failing(id: 'groq' | 'gemini', kind: 'rate_limit' | 'temporary' | 'timeout') {
  const provider = {
    id, model: `${id}-model`, supportsJson: true, calls: 0,
    async normalize() {
      provider.calls += 1
      throw new AIProviderError(kind, 'safe failure', { retryAfterMs: 20 })
    },
  }
  return provider as AIProvider & { calls: number }
}

describe('AI router', () => {
  it('fails over from Groq 429 to Gemini and stops after the first success', async () => {
    const router = createAIRouter({ providers: [failing('groq', 'rate_limit'), succeeding('gemini')], config: testConfig() })
    const result = await router.normalize(input)
    expect(result).toMatchObject({ success: true, provider: 'gemini', fallbackDepth: 1, aiProcessed: true })
  })

  it('uses deterministic fallback when all providers fail without throwing', async () => {
    const router = createAIRouter({ providers: [failing('groq', 'temporary'), failing('gemini', 'timeout')], config: testConfig() })
    const result = await router.normalize(input)
    expect(result).toMatchObject({ success: true, provider: 'deterministic', aiProcessed: false })
    expect(result.feedback.developer_prompt).toContain('reproduce the issue')
  })

  it('opens cooldown after three temporary failures and probes only after cooldown', async () => {
    let now = 0
    const clock = { now: () => now, advance: (ms: number) => { now += ms } }
    const provider = failing('groq', 'temporary')
    const router = createAIRouter({ providers: [provider], config: { ...testConfig(), cooldownMs: 1_000 }, clock })
    await router.normalize(input); await router.normalize(input); await router.normalize(input)
    expect(router.getStatus().find((status) => status.provider === 'groq')?.health).toBe('cooldown')
    await router.normalize(input)
    expect(provider.calls).toBe(3)
    clock.advance(1_000)
    await router.normalize(input)
    expect(provider.calls).toBe(4)
  })

  it('reports missing configured providers as not configured without exposing credentials', () => {
    const router = createAIRouter({ providers: [succeeding('groq')], config: testConfig() })
    const gemini = router.getStatus().find((status) => status.provider === 'gemini')
    expect(gemini).toMatchObject({ enabled: false, health: 'disabled' })
    expect(gemini?.model).toBe('gemini-model')
  })

  it('disables invalid credentials and does not call that provider again', async () => {
    const provider = failing('groq', 'temporary')
    const authProvider: AIProvider = {
      ...provider,
      async normalize() { throw new AIProviderError('auth', 'invalid credentials') },
    }
    const router = createAIRouter({ providers: [authProvider], config: testConfig() })
    await router.normalize(input)
    await router.normalize(input)
    expect(router.getStatus().find((status) => status.provider === 'groq')).toMatchObject({ enabled: false, lastFailureKind: 'auth' })
  })

  it('turns a provider timeout into deterministic fallback within the bounded timeout', async () => {
    const provider: AIProvider = { id: 'groq', model: 'groq-model', supportsJson: true, normalize: async () => new Promise(() => undefined) }
    const started = Date.now()
    const router = createAIRouter({ providers: [provider], config: { ...testConfig(), providerTimeoutMs: 10, syncBudgetMs: 20 } })
    const result = await router.normalize(input)
    expect(result.aiProcessed).toBe(false)
    expect(Date.now() - started).toBeLessThan(500)
  })
})
