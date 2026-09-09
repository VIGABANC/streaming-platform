import { createChatProvider } from '../provider-utils'

const strictStructuredOutputModels = new Set([
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
])

export function createGroqProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }) {
  return createChatProvider({
    ...options,
    id: 'groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    strictJsonSchema: strictStructuredOutputModels.has(options.model),
  })
}
