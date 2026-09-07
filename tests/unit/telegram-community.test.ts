import { describe, expect, it } from 'vitest'
import { handleCommunityUpdate, parseCommunityUpdate } from '@/lib/telegram-community'

describe('VEYRA Community Bot', () => {
  it('ignores unrelated group chatter while accepting a mention', () => {
    expect(parseCommunityUpdate({ message: { message_id: 1, chat: { id: 2, type: 'group' }, text: 'hello everyone' } }, 'veyra_bot')).toEqual({ kind: 'ignore' })
    expect(parseCommunityUpdate({ message: { message_id: 2, chat: { id: 2, type: 'group' }, text: 'hey @veyra_bot help' } }, 'veyra_bot')).toMatchObject({ kind: 'message', addressed: true })
  })

  it('answers with a private report link when a user reports a problem', async () => {
    const sent: Array<{ text: string; options?: unknown }> = []
    const update = parseCommunityUpdate({ message: { message_id: 2, chat: { id: 2, type: 'private' }, text: '/start' } }, 'veyra_bot')
    await handleCommunityUpdate(update, { feedbackBotUsername: 'veyra_feedback_bot', messenger: { sendMessage: async (_chat, text, options) => { sent.push({ text, options }) } } })
    expect(sent[0].text).toContain('Welcome')
    expect(JSON.stringify(sent[0].options)).toContain('start=bug')
  })
})
