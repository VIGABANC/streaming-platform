import { describe, expect, it } from 'vitest'
import { deterministicFallback } from '@/lib/feedback/normalize'
import { renderGitHubIssue } from '@/lib/feedback/github'
import type { FeedbackRecord } from '@/lib/feedback/types'

const record: FeedbackRecord = {
  id: 'row-1', ticket: 'VEYRA-TEST', chatId: '22', messageId: 4,
  input: {
    description: 'Bearer [REDACTED] playback fails.', type: 'bug', category: 'playback', severity: 'P1',
    route: '/watch/movie/42', expectedBehavior: 'Video starts.', actualBehavior: 'Spinner remains.', environment: {},
  },
  normalized: deterministicFallback({
    description: 'Bearer [REDACTED] playback fails.', type: 'bug', category: 'playback', severity: 'P1',
    route: '/watch/movie/42', expectedBehavior: 'Video starts.', actualBehavior: 'Spinner remains.', environment: {},
  }),
  aiStatus: 'AI_UNAVAILABLE', aiProvider: null, aiModel: null, fallbackDepth: 8,
  githubStatus: 'PENDING', githubIssueNumber: null, githubIssueUrl: null,
  createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString(),
}

describe('GitHub issue rendering', () => {
  it('separates facts, inferences, unknowns, and verification without secret or Telegram metadata', () => {
    const issue = renderGitHubIssue(record)
    expect(issue.title).toContain('[P1]')
    expect(issue.body).toContain('User-reported facts')
    expect(issue.body).toContain('Required verification')
    expect(issue.body).not.toContain('22')
    expect(issue.body).not.toContain('Bearer [REDACTED]')
  })

  it('redacts secrets that appear in model-generated fields before GitHub storage', () => {
    const issue = renderGitHubIssue({ ...record, normalized: { ...record.normalized, summary: 'api_key=secret-value' } })
    expect(issue.body).not.toContain('secret-value')
  })
})
