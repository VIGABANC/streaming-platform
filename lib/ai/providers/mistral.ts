import { createChatProvider } from '../provider-utils'
export function createMistralProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }) {
  return createChatProvider({ ...options, id: 'mistral', endpoint: 'https://api.mistral.ai/v1/chat/completions' })
}
