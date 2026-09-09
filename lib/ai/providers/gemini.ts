import type { SanitizedFeedback } from '@/lib/feedback/types'
import {
  buildNormalizationPrompt,
  normalizedFeedbackJsonSchema,
  parseProviderFeedback,
  requestJson,
} from '../provider-utils'
import { AIProviderError, type AIProvider } from '../types'

function interactionText(value: unknown): string {
  if (typeof value !== 'object' || value === null) {
    throw new AIProviderError('invalid_response', 'Gemini response was not an object')
  }

  const steps = Array.isArray((value as { steps?: unknown[] }).steps)
    ? (value as { steps: unknown[] }).steps
    : []

  const texts: string[] = []
  for (const step of steps) {
    if (typeof step !== 'object' || step === null) continue
    const candidate = step as { type?: unknown; content?: unknown[] }
    if (candidate.type !== 'model_output' || !Array.isArray(candidate.content)) continue
    for (const item of candidate.content) {
      if (typeof item !== 'object' || item === null) continue
      const content = item as { type?: unknown; text?: unknown }
      if (content.type === 'text' && typeof content.text === 'string' && content.text.trim()) {
        texts.push(content.text)
      }
    }
  }

  const text = texts.join('\n').trim()
  if (!text) throw new AIProviderError('invalid_response', 'Gemini response did not contain text')
  return text
}

export function createGeminiProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }): AIProvider {
  return {
    id: 'gemini',
    model: options.model,
    supportsJson: true,
    async normalize(input: SanitizedFeedback, context) {
      const value = await requestJson(
        options.fetchImpl ?? fetch,
        'https://generativelanguage.googleapis.com/v1beta/interactions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': options.apiKey,
          },
          body: JSON.stringify({
            model: options.model,
            input: buildNormalizationPrompt(input),
            response_format: {
              type: 'text',
              mime_type: 'application/json',
              schema: normalizedFeedbackJsonSchema(input),
            },
            generation_config: {
              max_output_tokens: 1_200,
            },
          }),
        },
        context,
      )

      return parseProviderFeedback(interactionText(value), input)
    },
  }
}
