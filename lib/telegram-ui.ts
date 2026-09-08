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

const DEFAULT_VEYRA_BASE_URL = 'https://streaming-platform-beryl.vercel.app'

function siteUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`
}

export function communityKeyboard(feedbackUsername = '', baseUrl = DEFAULT_VEYRA_BASE_URL): TelegramReplyMarkup {
  const feedback = feedbackUsername ? deepLink(feedbackUsername, 'bug') : undefined
  return inlineKeyboard([
    [{ text: '🔎 Search VEYRA', url: siteUrl(baseUrl, '/search') }, { text: '🎬 Discover', url: siteUrl(baseUrl, '/discover') }],
    [{ text: '🎭 Movies', url: siteUrl(baseUrl, '/movies') }, { text: '📺 Series', url: siteUrl(baseUrl, '/tv') }],
    [{ text: '🍥 Anime', url: siteUrl(baseUrl, '/discover') }, { text: '🆘 Help', callback_data: 'community:help' }],
    feedback ? [{ text: '▶️ Playback issue', url: deepLink(feedbackUsername, 'playback') }] : [{ text: '▶️ Playback issue', callback_data: 'community:report:playback' }],
    feedback ? [{ text: '🐛 Report a problem', url: feedback }] : [{ text: '🐛 Report a problem', callback_data: 'community:report:bug' }],
    feedback ? [{ text: '💡 Suggest a feature', url: deepLink(feedbackUsername, 'feature') }] : [{ text: '💡 Suggest a feature', callback_data: 'community:report:feature' }],
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
