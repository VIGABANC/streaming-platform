import { deterministicFallback } from '@/lib/feedback/normalize'
import type { NormalizedFeedback, SanitizedFeedback } from '@/lib/feedback/types'
import { createConfiguredProviders, getAIConfig } from './config'
import { AIProviderError, type AIConfig, type AIProvider, type AIProviderFailureKind, type AIProviderStatus, type ProviderHealth } from './types'

export interface AIRouterResult {
  success: true
  provider: string
  model: string | null
  fallbackDepth: number
  latencyMs: number
  aiProcessed: boolean
  feedback: NormalizedFeedback
}

export interface AIMetrics {
  reportsReceived: number
  reportsAIProcessed: number
  reportsDeterministic: number
  providerSuccesses: Record<string, number>
  providerFailures: Record<string, number>
  provider429s: Record<string, number>
  providerTimeouts: Record<string, number>
}

export interface AIRouter {
  normalize(input: SanitizedFeedback): Promise<AIRouterResult>
  getStatus(): AIProviderStatus[]
  getMetrics(): AIMetrics
}

interface Clock {
  now(): number
}

interface ProviderState {
  provider: AIProvider
  health: ProviderHealth
  consecutiveFailures: number
  lastSuccess: number | null
  lastFailure: number | null
  lastFailureKind: AIProviderFailureKind | null
  cooldownUntil: number | null
  retryAfterMs: number | null
  latencyTotal: number
  latencyCount: number
}

const emptyMetrics = (): AIMetrics => ({
  reportsReceived: 0,
  reportsAIProcessed: 0,
  reportsDeterministic: 0,
  providerSuccesses: {},
  providerFailures: {},
  provider429s: {},
  providerTimeouts: {},
})

function increment(bucket: Record<string, number>, key: string): void {
  bucket[key] = (bucket[key] ?? 0) + 1
}

function iso(value: number | null): string | null {
  return value === null ? null : new Date(value).toISOString()
}

function classify(error: unknown): AIProviderError {
  if (error instanceof AIProviderError) return error
  if (error instanceof DOMException && error.name === 'AbortError') return new AIProviderError('timeout', 'Provider request timed out')
  return new AIProviderError('temporary', 'Provider request failed')
}

async function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  let timeout: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort()
      reject(new AIProviderError('timeout', 'Provider request timed out'))
    }, timeoutMs)
  })
  try {
    return await Promise.race([operation(controller.signal), timeoutPromise])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export function createAIRouter(options: {
  providers?: AIProvider[]
  config?: AIConfig
  clock?: Clock
} = {}): AIRouter {
  const config = options.config ?? getAIConfig()
  const providers = options.providers ?? createConfiguredProviders(config)
  const clock = options.clock ?? { now: () => Date.now() }
  const states = new Map<AIProvider['id'], ProviderState>(providers.map((provider) => {
    const state: ProviderState = {
      provider,
      health: 'healthy',
      consecutiveFailures: 0,
      lastSuccess: null,
      lastFailure: null,
      lastFailureKind: null,
      cooldownUntil: null,
      retryAfterMs: null,
      latencyTotal: 0,
      latencyCount: 0,
    }
    return [provider.id, state]
  }))
  const metrics = emptyMetrics()

  function status(): AIProviderStatus[] {
    return config.providerOrder.flatMap((id) => {
      const state = states.get(id)
      if (!state) return [{
        provider: id,
        model: config.models[id],
        enabled: false,
        supportsJson: true,
        health: 'disabled' as const,
        consecutiveFailures: 0,
        lastSuccess: null,
        lastFailure: null,
        lastFailureKind: null,
        cooldownUntil: null,
        retryAfterMs: null,
        averageLatencyMs: null,
      }]
      return [{
        provider: state.provider.id,
        model: state.provider.model,
        enabled: state.health !== 'disabled',
        supportsJson: state.provider.supportsJson,
        health: state.health,
        consecutiveFailures: state.consecutiveFailures,
        lastSuccess: iso(state.lastSuccess),
        lastFailure: iso(state.lastFailure),
        lastFailureKind: state.lastFailureKind,
        cooldownUntil: iso(state.cooldownUntil),
        retryAfterMs: state.retryAfterMs,
        averageLatencyMs: state.latencyCount ? Math.round(state.latencyTotal / state.latencyCount) : null,
      }]
    })
  }

  async function normalize(input: SanitizedFeedback): Promise<AIRouterResult> {
    const started = clock.now()
    metrics.reportsReceived += 1
    let fallbackDepth = 0

    for (const id of config.providerOrder) {
      const state = states.get(id)
      if (!state || state.health === 'disabled') continue
      const now = clock.now()
      if (state.cooldownUntil !== null && now < state.cooldownUntil) continue
      if (state.cooldownUntil !== null && now >= state.cooldownUntil) state.health = 'healthy'
      const remaining = config.syncBudgetMs - (clock.now() - started)
      if (remaining <= 0) break
      const callStarted = clock.now()
      try {
        const feedback = await withTimeout(
          (signal) => state.provider.normalize(input, { signal }),
          Math.max(1, Math.min(config.providerTimeoutMs, remaining)),
        )
        const latency = Math.max(0, clock.now() - callStarted)
        state.health = 'healthy'
        state.consecutiveFailures = 0
        state.lastSuccess = clock.now()
        state.lastFailureKind = null
        state.cooldownUntil = null
        state.retryAfterMs = null
        state.latencyTotal += latency
        state.latencyCount += 1
        metrics.reportsAIProcessed += 1
        increment(metrics.providerSuccesses, state.provider.id)
        return { success: true, provider: state.provider.id, model: state.provider.model, fallbackDepth, latencyMs: Math.max(0, clock.now() - started), aiProcessed: true, feedback }
      } catch (unknownError) {
        const error = classify(unknownError)
        state.lastFailure = clock.now()
        state.lastFailureKind = error.kind
        increment(metrics.providerFailures, state.provider.id)
        if (error.kind === 'rate_limit') increment(metrics.provider429s, state.provider.id)
        if (error.kind === 'timeout') increment(metrics.providerTimeouts, state.provider.id)
        if (error.kind === 'auth') {
          state.health = 'disabled'
        } else {
          state.consecutiveFailures += 1
          state.retryAfterMs = error.retryAfterMs
          if (state.consecutiveFailures >= config.circuitFailureThreshold) {
            state.health = 'cooldown'
            state.cooldownUntil = clock.now() + Math.max(config.cooldownMs, error.retryAfterMs ?? 0)
          }
        }
        fallbackDepth += 1
      }
    }

    metrics.reportsDeterministic += 1
    return {
      success: true,
      provider: 'deterministic',
      model: null,
      fallbackDepth,
      latencyMs: Math.max(0, clock.now() - started),
      aiProcessed: false,
      feedback: deterministicFallback(input),
    }
  }

  return { normalize, getStatus: status, getMetrics: () => ({ ...metrics, providerSuccesses: { ...metrics.providerSuccesses }, providerFailures: { ...metrics.providerFailures }, provider429s: { ...metrics.provider429s }, providerTimeouts: { ...metrics.providerTimeouts } }) }
}

let defaultRouter: AIRouter | undefined
export function getAIRouter(): AIRouter {
  if (!defaultRouter) {
    try {
      defaultRouter = createAIRouter()
    } catch {
      defaultRouter = createAIRouter({ providers: [], config: getAIConfig({}) })
    }
  }
  return defaultRouter
}
