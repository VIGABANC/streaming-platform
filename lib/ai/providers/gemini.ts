import { parseNormalizedFeedback } from '@/lib/feedback/normalize'
import { buildNormalizationPrompt, requestJson } from '../provider-utils'
import { AIProviderError, type AIProvider } from '../types'

export function createGeminiProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }): AIProvider {
  return {
    id: 'gemini', model: options.model, supportsJson: true,
    async normalize(input, context) {
      const value = await requestJson(options.fetchImpl ?? fetch, `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(options.model)}:generateContent?key=${encodeURIComponent(options.apiKey)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: buildNormalizationPrompt(input) }] }], generationConfig: { temperature: 0, responseMimeType: 'application/json', maxOutputTokens: 1200 } }),
      }, context)
      const candidates = typeof value === 'object' && value !== null ? (value as { candidates?: unknown[] }).candidates : undefined
      const parts = candidates?.[0] && typeof candidates[0] === 'object' ? (candidates[0] as { content?: { parts?: { text?: string }[] } }).content?.parts : undefined
      const text = parts?.[0]?.text
      if (!text) throw new AIProviderError('invalid_response', 'Gemini response did not contain text')
      return parseNormalizedFeedback(text, input)
    },
  }
}
