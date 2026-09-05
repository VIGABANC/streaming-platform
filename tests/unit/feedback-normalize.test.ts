import { describe, expect, it } from 'vitest'
import {
  deterministicFallback,
  parseNormalizedFeedback,
  sanitizeFeedback,
} from '@/lib/feedback/normalize'
import type { SanitizedFeedback } from '@/lib/feedback/types'

const input: SanitizedFeedback = {
  description: 'Playback fails after pressing play.',
  type: 'bug',
  category: 'playback',
  severity: 'P1',
  route: '/watch/movie/42',
  expectedBehavior: 'The video starts.',
  actualBehavior: 'The player stays loading.',
  environment: { browser: 'Firefox' },
}

describe('feedback normalization', () => {
  it('strips Telegram identity and obvious secrets before provider use', () => {
    const safe = sanitizeFeedback({
      description: 'Bearer abc123; password=hunter2; playback fails',
      type: 'bug',
      category: 'playback',
      severity: 'P1',
      route: '/watch/movie/42',
      telegramUserId: '987',
      telegramUsername: 'secret-user',
      environment: { browser: 'Firefox' },
    })

    expect(safe).not.toHaveProperty('telegramUserId')
    expect(safe).not.toHaveProperty('telegramUsername')
    expect(safe.description).not.toContain('abc123')
    expect(safe.description).not.toContain('hunter2')
  })

  it('creates a usable deterministic engineering ticket without AI', () => {
    const result = deterministicFallback({
      description: 'The stream stays loading on the episode page.',
      type: 'playback',
      category: 'streaming',
      severity: 'P1',
      route: '/watch/tv/42/1/2',
      expectedBehavior: 'Video starts',
      actualBehavior: 'Spinner never ends',
      environment: {},
    })

    expect(result.title).toBe('Playback — Streaming — user-reported loading problem')
    expect(result.developer_prompt).toContain("The user's description is evidence")
    expect(result.confidence).toBe(0)
  })

  it('rejects model output that invents missing facts or violates schema', () => {
    expect(() => parseNormalizedFeedback({ type: 'bug', title: 'Invented route /admin' }, input)).toThrow()
  })

  it('rejects model-generated environment facts that were not supplied by the user', () => {
    expect(() => parseNormalizedFeedback({ ...deterministicFallback(input), environment: { os: 'Windows' } }, input)).toThrow()
  })
})
