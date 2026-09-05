import type { NormalizedFeedback, SanitizedFeedback } from '@/lib/feedback/types'

export const aiProviderIds = ['groq', 'gemini', 'cloudflare', 'mistral', 'openrouter', 'cohere', 'huggingface', 'cerebras', 'nvidia'] as const
export type AIProviderId = (typeof aiProviderIds)[number] | 'deterministic'
export type AIProviderFailureKind = 'rate_limit' | 'auth' | 'temporary' | 'timeout' | 'invalid_response' | 'configuration'

export class AIProviderError extends Error {
  readonly kind: AIProviderFailureKind
  readonly status: number | null
  readonly retryAfterMs: number | null

  constructor(kind: AIProviderFailureKind, message: string, options: { status?: number; retryAfterMs?: number } = {}) {
    super(message)
    this.name = 'AIProviderError'
    this.kind = kind
    this.status = options.status ?? null
    this.retryAfterMs = options.retryAfterMs ?? null
  }
}

export interface AIProviderContext {
  signal: AbortSignal
}

export interface AIProvider {
  readonly id: AIProviderId
  readonly model: string
  readonly supportsJson: boolean
  normalize(input: SanitizedFeedback, context: AIProviderContext): Promise<NormalizedFeedback>
}

export type ProviderHealth = 'healthy' | 'cooldown' | 'disabled'

export interface AIProviderStatus {
  provider: AIProviderId
  model: string
  enabled: boolean
  supportsJson: boolean
  health: ProviderHealth
  consecutiveFailures: number
  lastSuccess: string | null
  lastFailure: string | null
  lastFailureKind: AIProviderFailureKind | null
  cooldownUntil: string | null
  retryAfterMs: number | null
  averageLatencyMs: number | null
}

export interface AIConfig {
  providerOrder: readonly AIProviderId[]
  providerTimeoutMs: number
  syncBudgetMs: number
  cooldownMs: number
  circuitFailureThreshold: number
  allowPaidAi: boolean
  zeroCostOnly: boolean
  models: Record<AIProviderId, string>
  credentials: Partial<Record<AIProviderId, string>>
  cloudflareAccountId: string | null
}
