import { deterministicFallback } from '@/lib/feedback/normalize'
import type { AIProvider } from '../types'

export const deterministicProvider: AIProvider = {
  id: 'deterministic',
  model: 'deterministic',
  supportsJson: true,
  async normalize(input) {
    return deterministicFallback(input)
  },
}
