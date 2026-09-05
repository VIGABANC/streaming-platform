import { parseNormalizedFeedback } from '@/lib/feedback/normalize'
import { buildNormalizationPrompt, requestJson } from '../provider-utils'
import { AIProviderError, type AIProvider } from '../types'

export function createHuggingFaceProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }): AIProvider {
  return {
    id: 'huggingface', model: options.model, supportsJson: false,
    async normalize(input, context) {
      const value = await requestJson(options.fetchImpl ?? fetch, `https://api-inference.huggingface.co/models/${options.model}`, {
        method: 'POST', headers: { Authorization: `Bearer ${options.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: buildNormalizationPrompt(input), parameters: { max_new_tokens: 1200, return_full_text: false } }),
      }, context)
      const first = Array.isArray(value) ? value[0] : value
      const text = typeof first === 'object' && first !== null ? (first as { generated_text?: string }).generated_text : undefined
      if (!text) throw new AIProviderError('invalid_response', 'Hugging Face response did not contain text')
      return parseNormalizedFeedback(text, input)
    },
  }
}
