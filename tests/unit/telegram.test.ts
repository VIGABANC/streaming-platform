import { describe, expect, it } from 'vitest'
import { createDefaultTelegramDependencies, formatAIStatus, formatTelegramWebhookError, handleTelegramUpdate, isAdminChat, parseTelegramUpdate } from '@/lib/telegram'

describe('Telegram feedback interface', () => {
  it('accepts a report through the webhook shape without sending identity to the workflow', () => {
    const report = parseTelegramUpdate({
      message: {
        message_id: 4,
        chat: { id: 22, type: 'private' },
        from: { id: 99, username: 'hidden' },
        text: '/bug Player keeps loading at /watch/movie/42',
      },
    })

    expect(report).toMatchObject({ kind: 'report', chatId: '22', feedback: { type: 'bug', route: '/watch/movie/42' } })
    if (report.kind === 'report') expect(report.feedback).not.toHaveProperty('telegramUserId')
  })

  it('restricts admin commands to configured private admin chats', () => {
    expect(isAdminChat('42', { TELEGRAM_ADMIN_CHAT_IDS: '42' })).toBe(true)
    expect(isAdminChat('43', { TELEGRAM_ADMIN_CHAT_IDS: '42' })).toBe(false)
    const groupCommand = parseTelegramUpdate({ message: { message_id: 5, chat: { id: 42, type: 'group' }, text: '/aistatus' } })
    expect(groupCommand).toMatchObject({ kind: 'command', privateChat: false })
  })

  it('formats provider status without credentials or quota secrets', () => {
    const output = formatAIStatus([{ provider: 'groq', model: 'secret-model', health: 'healthy', enabled: true, supportsJson: true, consecutiveFailures: 0, lastSuccess: null, lastFailure: null, lastFailureKind: null, cooldownUntil: null, retryAfterMs: null, averageLatencyMs: 12 }])
    expect(output).toContain('Groq')
    expect(output).toContain('healthy')
    expect(output).not.toContain('secret-model')
  })

  it('serves admin status commands even when Supabase is unavailable', async () => {
    const dependencies = createDefaultTelegramDependencies({
      TELEGRAM_ADMIN_CHAT_IDS: '42',
      TELEGRAM_BOT_TOKEN: 'test-token',
    })
    const sent: string[] = []
    const command = parseTelegramUpdate({ message: { message_id: 6, chat: { id: 42, type: 'private' }, text: '/aistatus' } })

    await handleTelegramUpdate(command, { ...dependencies, messenger: { sendMessage: async (_chatId, text) => { sent.push(text) } } })

    expect(sent[0]).toContain('VEYRA AI Router')
  })

  it('exposes a safe webhook error message without leaking bot tokens', () => {
    expect(formatTelegramWebhookError(new Error('Telegram acknowledgement failed (401)'))).toBe('Telegram acknowledgement failed (401)')
    expect(formatTelegramWebhookError(new Error('request failed for https://api.telegram.org/bot123456:super-secret-token/sendMessage'))).toContain('[REDACTED]')
    expect(formatTelegramWebhookError(new Error('request failed for https://api.telegram.org/bot123456:super-secret-token/sendMessage'))).not.toContain('super-secret-token')
  })
})
