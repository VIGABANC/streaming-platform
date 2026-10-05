import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PLAYER_FRAME_ORIGINS } from '@/lib/player'

describe('CSP frame-src registry drift', () => {
  it('contains every registered provider origin and preserves security controls', () => {
    const config = readFileSync(new URL('../../next.config.mjs', import.meta.url), 'utf8')
    const frameSrc = config.match(/frame-src[^\n]+/)?.[0] ?? ''
    for (const origin of PLAYER_FRAME_ORIGINS) expect(frameSrc).toContain(origin)
    expect(config).toContain("frame-ancestors 'none'")
    expect(config).not.toContain("'unsafe-eval'")
  })
})
