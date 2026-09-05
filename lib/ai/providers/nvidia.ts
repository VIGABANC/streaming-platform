import { createChatProvider } from '../provider-utils'
export function createNvidiaProvider(options: { apiKey: string; model: string; fetchImpl?: typeof fetch }) {
  return createChatProvider({ ...options, id: 'nvidia', endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions' })
}
