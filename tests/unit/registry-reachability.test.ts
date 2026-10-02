import { describe, expect, it } from 'vitest'
import { PROVIDERS } from '@/lib/player'

describe('playback provider registry safety', () => {
  it('contains no known-dead provider origins', () => {
    const origins = PROVIDERS.map((provider) => provider.origin)
    expect(origins.some((origin) => /autoembed\.cc|smashystream\.com/i.test(origin))).toBe(false)
  })
})
