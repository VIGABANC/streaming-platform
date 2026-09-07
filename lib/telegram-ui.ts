import type { FeedbackType } from '@/lib/feedback/types'

export interface TelegramInlineButton {
  text: string
  callback_data?: string
  url?: string
}

export interface TelegramReplyMarkup {
  inline_keyboard: TelegramInlineButton[][]
}

export function inlineKeyboard(rows: TelegramInlineButton[][]): TelegramReplyMarkup {
  return { inline_keyboard: rows }
}

export function deepLink(username: string, payload: string): string {
  const normalized = username.replace(/^@/, '').trim()
  return `https://t.me/${normalized}?start=${encodeURIComponent(payload)}`
}

export function communityKeyboard(feedbackUsername = ''): TelegramReplyMarkup {
  const feedback = feedbackUsername ? deepLink(feedbackUsername, 'bug') : undefined
  return inlineKeyboard([
    [{ text: '🎬 Discover', callback_data: 'community:discover' }, { text: '🔎 Search VEYRA', callback_data: 'community:search' }],
    [{ text: '🎭 Movies', callback_data: 'community:movies' }, { text: '📺 Series', callback_data: 'community:series' }],
    [{ text: '🍥 Anime', callback_data: 'community:anime' }, { text: '🆘 Help', callback_data: 'community:help' }],
    feedback ? [{ text: '🐛 Report a problem', url: feedback }, { text: '💡 Suggest a feature', url: deepLink(feedbackUsername, 'feature') }] : [{ text: '🐛 Report a problem', callback_data: 'community:report:bug' }, { text: '💡 Suggest a feature', callback_data: 'community:report:feature' }],
  ])
}

export function feedbackTypeKeyboard(): TelegramReplyMarkup {
  return inlineKeyboard([
    [{ text: '🐛 Bug', callback_data: 'feedback:type:bug' }, { text: '▶️ Playback', callback_data: 'feedback:type:playback' }],
    [{ text: '✨ Feature', callback_data: 'feedback:type:feature' }, { text: '🎨 UX', callback_data: 'feedback:type:ux' }],
    [{ text: '😡 Complaint', callback_data: 'feedback:type:complaint' }],
    [{ text: '❌ Cancel', callback_data: 'feedback:cancel' }],
  ])
}

export function feedbackContextKeyboard(): TelegramReplyMarkup {
  return inlineKeyboard([[{ text: '⏭ Skip', callback_data: 'feedback:skip-context' }, { text: '❌ Cancel', callback_data: 'feedback:cancel' }]])
}

export function feedbackReviewKeyboard(): TelegramReplyMarkup {
  return inlineKeyboard([
    [{ text: '✅ Submit', callback_data: 'feedback:submit' }, { text: '✏️ Edit', callback_data: 'feedback:edit' }],
    [{ text: '❌ Cancel', callback_data: 'feedback:cancel' }],
  ])
}

export function adminKeyboard(ticket: string): TelegramReplyMarkup {
  const safe = encodeURIComponent(ticket)
  return inlineKeyboard([
    [{ text: '👤 Assign', callback_data: `admin:assign:${safe}` }, { text: '🔍 Need info', callback_data: `admin:need-info:${safe}` }],
    [{ text: '🤖 Reprocess AI', callback_data: `admin:reprocess:${safe}` }, { text: '🐙 GitHub issue', callback_data: `admin:github:${safe}` }],
    [{ text: '📣 Notify user', callback_data: `admin:notify:${safe}` }],
    [{ text: '✅ Resolve', callback_data: `admin:resolve:${safe}` }, { text: '🚫 Close', callback_data: `admin:close:${safe}` }],
  ])
}

export function isFeedbackType(value: string): value is FeedbackType {
  return ['bug', 'playback', 'feature', 'ux', 'complaint'].includes(value)
}
