import { parseNormalizedFeedback } from '@/lib/feedback/normalize'
import { buildNormalizationPrompt, requestJson } from '../provider-utils'
import { AIProviderError, type AIProvider } from '../types'

export function createCloudflareProvider(options: { accountId: string; apiToken: string; model: string; fetchImpl?: typeof fetch }): AIProvider {
  return {
    id: 'cloudflare', model: options.model, supportsJson: true,
    async normalize(input, context) {
      const value = await requestJson(options.fetchImpl ?? fetch, `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(options.accountId)}/ai/run/${encodeURIComponent(options.model)}`, {
        method: 'POST', headers: { Authorization: `Bearer ${options.apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: 'Return strict normalized feedback JSON.' }, { role: 'user', content: buildNormalizationPrompt(input) }], temperature: 0, max_tokens: 1200 }),
      }, context)
      const result = typeof value === 'object' && value !== null ? (value as { result?: { response?: string } }).result : undefined
      if (!result?.response) throw new AIProviderError('invalid_response', 'Cloudflare response did not contain text')
      return parseNormalizedFeedback(result.response, input)
    },
  }
}
