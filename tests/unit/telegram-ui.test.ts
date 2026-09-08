import { describe, expect, it } from 'vitest'
import { adminKeyboard, communityKeyboard, deepLink, feedbackReviewKeyboard, feedbackTypeKeyboard } from '@/lib/telegram-ui'

describe('Telegram UI', () => {
  it('builds private feedback deep links', () => {
    expect(deepLink('@veyra_feedback_bot', 'playback')).toBe('https://t.me/veyra_feedback_bot?start=playback')
  })

  it('keeps public community actions as buttons and routes reports privately', () => {
    const keyboard = communityKeyboard('veyra_feedback_bot')
    expect(keyboard.inline_keyboard.flat().some((button) => button.url?.includes('start=bug'))).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.url === 'https://streaming-platform-beryl.vercel.app/search')).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.url === 'https://streaming-platform-beryl.vercel.app/movies')).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.url === 'https://t.me/veyra_feedback_bot?start=playback')).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.url === 'https://t.me/veyra_feedback_bot?start=missing-movie')).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.url === 'https://t.me/veyra_feedback_bot?start=missing-series')).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.url === 'https://t.me/veyra_feedback_bot?start=missing-anime')).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.url === 'https://t.me/veyra_feedback_bot?start=recommendation')).toBe(true)
    expect(keyboard.inline_keyboard.flat().some((button) => button.callback_data === 'community:search')).toBe(false)
  })

  it('uses compact callback ids for wizard and admin actions', () => {
    expect(feedbackTypeKeyboard().inline_keyboard.flat().map((button) => button.callback_data)).toContain('feedback:type:playback')
    expect(feedbackReviewKeyboard().inline_keyboard.flat().map((button) => button.callback_data)).toContain('feedback:submit')
    expect(adminKeyboard('VEYRA-20260905-ABC12345').inline_keyboard.flat().map((button) => button.callback_data)).toContain('admin:resolve:VEYRA-20260905-ABC12345')
  })
})
