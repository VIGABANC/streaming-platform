import { describe, expect, it } from 'vitest'
import { handleCommunityUpdate, parseCommunityUpdate } from '@/lib/telegram-community'

describe('VEYRA Community Bot', () => {
  it('ignores unrelated group chatter while accepting a mention', () => {
    expect(parseCommunityUpdate({ message: { message_id: 1, chat: { id: 2, type: 'group' }, text: 'hello everyone' } }, 'veyra_bot')).toEqual({ kind: 'ignore' })
    expect(parseCommunityUpdate({ message: { message_id: 2, chat: { id: 2, type: 'group' }, text: 'hey @veyra_bot help' } }, 'veyra_bot')).toMatchObject({ kind: 'message', addressed: true })
  })

  it('accepts plain start and report commands in groups', () => {
    expect(parseCommunityUpdate({ message: { message_id: 3, chat: { id: -2, type: 'group' }, text: '/start' } }, 'veyra_bot')).toMatchObject({ kind: 'message', addressed: true })
    expect(parseCommunityUpdate({ message: { message_id: 4, chat: { id: -2, type: 'group' }, text: '/report' } }, 'veyra_bot')).toMatchObject({ kind: 'message', addressed: true })
  })

  it('answers with a private report link when a user reports a problem', async () => {
    const sent: Array<{ text: string; options?: unknown }> = []
    const update = parseCommunityUpdate({ message: { message_id: 2, chat: { id: 2, type: 'private' }, text: '/start' } }, 'veyra_bot')
    await handleCommunityUpdate(update, { feedbackBotUsername: 'veyra_feedback_bot', messenger: { sendMessage: async (_chat, text, options) => { sent.push({ text, options }) } } })
    expect(sent[0].text).toContain('Welcome')
    expect(JSON.stringify(sent[0].options)).toContain('start=bug')
    expect(JSON.stringify(sent[0].options)).toContain('https://streaming-platform-beryl.vercel.app/search')
  })

  it('answers report command with a direct private feedback button', async () => {
    const sent: Array<{ text: string; options?: unknown }> = []
    const update = parseCommunityUpdate({ message: { message_id: 5, chat: { id: -2, type: 'group' }, text: '/report' } }, 'veyra_bot')
    await handleCommunityUpdate(update, { feedbackBotUsername: 'veyra_feedback_bot', messenger: { sendMessage: async (_chat, text, options) => { sent.push({ text, options }) } } })
    expect(sent[0].text).toContain('Open the private Feedback Bot')
    expect(JSON.stringify(sent[0].options)).toContain('https://t.me/veyra_feedback_bot?start=bug')
  })

  it('does not spam the group with extra messages for menu callbacks', async () => {
    const sent: string[] = []
    const answers: string[] = []
    const update = parseCommunityUpdate({ callback_query: { id: 'cb1', data: 'community:series', message: { message_id: 3, chat: { id: -10, type: 'group' } } } }, 'veyra_bot')
    await handleCommunityUpdate(update, {
      feedbackBotUsername: 'veyra_feedback_bot',
      messenger: {
        sendMessage: async (_chat, text) => { sent.push(text) },
        answerCallbackQuery: async (_id, text) => { if (text) answers.push(text) },
      },
    })
    expect(sent).toEqual([])
    expect(answers).toEqual(['Browse Series for TV shows and seasonal releases.'])
  })
})
