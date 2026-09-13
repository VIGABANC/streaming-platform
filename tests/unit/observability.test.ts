import { describe, expect, it } from 'vitest'
import { PLAYER_EVENT_NAMES } from '@/lib/observability/client'

describe('player observability contract', () => {
  it('includes source resolution separately from frame loading and playback', () => {
    expect(PLAYER_EVENT_NAMES).toContain('player_source_resolution')
    expect(PLAYER_EVENT_NAMES).toContain('player_frame_loaded')
    expect(PLAYER_EVENT_NAMES).toContain('player_native_playback_started')
  })
})
