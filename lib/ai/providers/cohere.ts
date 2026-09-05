import { parseNormalizedFeedback } from '@/lib/feedback/normalize'
import { buildNormalizationPrompt, requestJson } from '../provider-utils'
import { AIProviderError, type AIProvider } from '../types'

export function createCohereProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }): AIProvider {
  return {
    id: 'cohere', model: options.model, supportsJson: true,
    async normalize(input, context) {
      const value = await requestJson(options.fetchImpl ?? fetch, 'https://api.cohere.com/v2/chat', {
        method: 'POST', headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: options.model, messages: [{ role: 'user', content: buildNormalizationPrompt(input) }], temperature: 0, max_tokens: 1200 }),
      }, context)
      const message = typeof value === 'object' && value !== null ? (value as { message?: { content?: { text?: string }[] } }).message : undefined
      const text = message?.content?.[0]?.text
      if (!text) throw new AIProviderError('invalid_response', 'Cohere response did not contain text')
      return parseNormalizedFeedback(text, input)
    },
  }
}
