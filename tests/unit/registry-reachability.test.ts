import { describe, expect, it } from 'vitest'
import { PROVIDERS } from '@/lib/player'

describe('playback provider registry safety', () => {
  it('contains no known-dead provider origins', () => {
    const origins = PROVIDERS.map((provider) => provider.origin)
    expect(origins.some((origin) => /autoembed\.cc|smashystream\.com|vidsrc\.wiki|vidsrc\.xyz/i.test(origin))).toBe(false)
    expect(PROVIDERS.map((provider) => provider.id)).toEqual(['vidfast', 'vidlink', '2embed', 'videasy', 'nontongo'])
  })
})
