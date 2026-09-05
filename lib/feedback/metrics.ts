import type { AIMetrics } from '@/lib/ai/router'

export function emptyFeedbackMetrics(): AIMetrics {
  return {
    reportsReceived: 0,
    reportsAIProcessed: 0,
    reportsDeterministic: 0,
    providerSuccesses: {},
    providerFailures: {},
    provider429s: {},
    providerTimeouts: {},
  }
}

export function mergeFeedbackMetrics(target: AIMetrics, source: AIMetrics): AIMetrics {
  target.reportsReceived += source.reportsReceived
  target.reportsAIProcessed += source.reportsAIProcessed
  target.reportsDeterministic += source.reportsDeterministic
  for (const key of Object.keys(source.providerSuccesses)) target.providerSuccesses[key] = (target.providerSuccesses[key] ?? 0) + source.providerSuccesses[key]!
  for (const key of Object.keys(source.providerFailures)) target.providerFailures[key] = (target.providerFailures[key] ?? 0) + source.providerFailures[key]!
  for (const key of Object.keys(source.provider429s)) target.provider429s[key] = (target.provider429s[key] ?? 0) + source.provider429s[key]!
  for (const key of Object.keys(source.providerTimeouts)) target.providerTimeouts[key] = (target.providerTimeouts[key] ?? 0) + source.providerTimeouts[key]!
  return target
}
