import { AIProviderError } from '../types'
import { createChatProvider } from '../provider-utils'
export function createOpenRouterProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }) {
  if (!(options.model === 'openrouter/free' || options.model.endsWith(':free'))) {
    throw new AIProviderError('configuration', 'OpenRouter model must be free')
  }
  return createChatProvider({ ...options, id: 'openrouter', endpoint: 'https://openrouter.ai/api/v1/chat/completions', headers: { 'HTTP-Referer': 'https://veyra.app', 'X-Title': 'VEYRA' } })
}
