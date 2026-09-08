import { describe, expect, it } from 'vitest'
import { deterministicFallback } from '@/lib/feedback/normalize'
import type { FeedbackRecord } from '@/lib/feedback/types'
import { handleTelegramUpdate, parseTelegramUpdate, type TelegramHandlerDependencies } from '@/lib/telegram'
import { createMemoryTelegramSessionStore } from '@/lib/telegram-sessions'

function dependencies(sent: string[]): TelegramHandlerDependencies {
  const records: FeedbackRecord[] = []
  return {
    env: { TELEGRAM_ADMIN_CHAT_IDS: '900' },
    sessionStore: createMemoryTelegramSessionStore(),
    repository: {
      async create(seed) { const record: FeedbackRecord = { ...seed, id: 'row-1', createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() }; records.push(record); return record },
      async update(id, patch) { const record = records.find((item) => item.id === id); if (!record) throw new Error('missing test record'); Object.assign(record, patch); return record },
      async getByTicket(ticket) { return records.find((item) => item.ticket === ticket) ?? null },
      async getByMessage(chatId, messageId) { return records.find((item) => item.chatId === chatId && item.messageId === messageId) ?? null },
    },
    router: { normalize: async (input) => ({ success: true, provider: 'deterministic', model: null, fallbackDepth: 1, latencyMs: 0, aiProcessed: false, feedback: deterministicFallback(input) }), getStatus: () => [] },
    issueTracker: { createIssue: async () => ({ number: 1, url: 'https://github.com/example/issues/1' }) },
    messenger: { sendMessage: async (_chat, text) => { sent.push(text) }, answerCallbackQuery: async () => undefined },
  }
}

describe('Feedback Bot wizard', () => {
  it('starts missing title and recommendation requests with specific prompts', async () => {
    const missingSent: string[] = []
    await handleTelegramUpdate(parseTelegramUpdate({ message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: 'private' }, text: '/start missing-movie' } }), dependencies(missingSent))
    expect(missingSent[0]).toContain('missing movie request')
    expect(missingSent[0]).toContain('Which movie is missing?')

    const recommendationSent: string[] = []
    await handleTelegramUpdate(parseTelegramUpdate({ message: { message_id: 1, from: { id: 43 }, chat: { id: 43, type: 'private' }, text: '/start recommendation' } }), dependencies(recommendationSent))
    expect(recommendationSent[0]).toContain('recommendation request')
    expect(recommendationSent[0]).toContain('What kind of recommendation')
  })

  it('walks from deep-link type to a durable submission', async () => {
    const sent: string[] = []
    const deps = dependencies(sent)
    const start = parseTelegramUpdate({ message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: 'private' }, text: '/start playback' } })
    await handleTelegramUpdate(start, deps)
    const description = parseTelegramUpdate({ message: { message_id: 2, from: { id: 42 }, chat: { id: 42, type: 'private' }, text: 'The player keeps loading.' } })
    await handleTelegramUpdate(description, deps)
    const skip = parseTelegramUpdate({ callback_query: { id: 'cb-1', from: { id: 42 }, data: 'feedback:skip-context', message: { message_id: 3, chat: { id: 42, type: 'private' } } } })
    await handleTelegramUpdate(skip, deps)
    const submit = parseTelegramUpdate({ callback_query: { id: 'cb-2', from: { id: 42 }, data: 'feedback:submit', message: { message_id: 4, chat: { id: 42, type: 'private' } } } })
    await handleTelegramUpdate(submit, deps)
    expect(sent.some((text) => text.includes('Thanks'))).toBe(true)
    expect(sent.some((text) => text.includes('VEYRA Report'))).toBe(true)
  })

  it('never shows an undefined description when a stale session is incomplete', async () => {
    const sent: string[] = []
    const deps = dependencies(sent)
    await deps.sessionStore!.save({ bot: 'feedback', chatId: '42', userId: '42', step: 'context', draft: { type: 'bug', category: 'bug' }, updatedAt: new Date().toISOString() })
    await handleTelegramUpdate(parseTelegramUpdate({ message: { message_id: 2, from: { id: 42 }, chat: { id: 42, type: 'private' }, text: 'Movie page' } }), deps)
    expect(sent.at(-1)).toContain('description was missing')
    expect(sent.join('\n')).not.toContain('Description: undefined')
  })
})
