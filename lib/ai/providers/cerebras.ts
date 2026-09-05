import { createChatProvider } from '../provider-utils'
export function createCerebrasProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }) {
  return createChatProvider({ ...options, id: 'cerebras', endpoint: 'https://api.cerebras.ai/v1/chat/completions' })
}
