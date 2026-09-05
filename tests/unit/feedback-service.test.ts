import { describe, expect, it } from 'vitest'
import { deterministicFallback } from '@/lib/feedback/normalize'
import { processFeedback } from '@/lib/feedback/service'
import type { AIRouterResult } from '@/lib/ai/router'
import type { FeedbackRecord, SanitizedFeedback } from '@/lib/feedback/types'

const input: SanitizedFeedback = {
  description: 'The stream stays loading.', type: 'playback', category: 'streaming', severity: 'P1',
  route: '/watch/tv/42/1/2', expectedBehavior: 'Video starts.', actualBehavior: 'Spinner never ends.', environment: {},
}
const report = { chatId: '22', messageId: 4, input }

function result(aiProcessed: boolean): AIRouterResult {
  const feedback = deterministicFallback(input)
  return { success: true, provider: aiProcessed ? 'gemini' : 'deterministic', model: aiProcessed ? 'flash' : null, fallbackDepth: aiProcessed ? 1 : 2, latencyMs: 12, aiProcessed, feedback: aiProcessed ? { ...feedback, confidence: 0.8 } : feedback }
}

function recordingRepo(events: string[]) {
  const records: FeedbackRecord[] = []
  return {
    records,
    async create(seed: Omit<FeedbackRecord, 'id' | 'createdAt' | 'updatedAt'>) {
      events.push('repository.create')
      const now = new Date(0).toISOString()
      const record = { ...seed, id: 'row-1', createdAt: now, updatedAt: now }
      records.push(record)
      return record
    },
    async update(id: string, patch: Partial<FeedbackRecord>) {
      events.push('repository.update')
      const record = records.find((item) => item.id === id)!
      Object.assign(record, patch, { updatedAt: new Date(0).toISOString() })
      return record
    },
    async getByTicket(ticket: string) { return records.find((record) => record.ticket === ticket) ?? null },
  }
}

describe('feedback workflow', () => {
  it('persists before AI, creates a deterministic ticket when AI is unavailable, and acknowledges the user', async () => {
    const events: string[] = []
    const repository = recordingRepo(events)
    const resultValue = await processFeedback(report, {
      repository,
      router: { normalize: async () => { events.push('router.normalize'); return result(false) } },
      issueTracker: { createIssue: async () => { events.push('issues.create'); return { number: 17, url: 'https://github.com/veyra/issues/17' } } },
      messenger: { sendMessage: async () => { events.push('messenger.send') } },
    })

    expect(events).toEqual(['repository.create', 'router.normalize', 'repository.update', 'issues.create', 'repository.update', 'messenger.send'])
    expect(resultValue.accepted).toBe(true)
    expect(resultValue.aiStatus).toBe('AI_UNAVAILABLE')
    expect(resultValue.feedback.developer_prompt).toContain('Required workflow')
  })

  it('keeps the persisted report when GitHub is unavailable', async () => {
    const repository = recordingRepo([])
    const resultValue = await processFeedback(report, {
      repository,
      router: { normalize: async () => result(true) },
      issueTracker: { createIssue: async () => { throw new Error('GitHub unavailable') } },
      messenger: { sendMessage: async () => undefined },
    })

    expect(resultValue.accepted).toBe(true)
    expect(resultValue.githubStatus).toBe('PENDING')
    expect(repository.records[0].ticket).toBe(resultValue.ticket)
  })
})
