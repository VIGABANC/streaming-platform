import { createChatProvider } from '../provider-utils'
export function createGroqProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }) {
  return createChatProvider({ ...options, id: 'groq', endpoint: 'https://api.groq.com/openai/v1/chat/completions' })
}
