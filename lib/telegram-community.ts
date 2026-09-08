import { createTelegramClient, formatTelegramWebhookError } from '@/lib/telegram'
import { communityKeyboard, deepLink, inlineKeyboard, isFeedbackType, type TelegramReplyMarkup } from '@/lib/telegram-ui'
import type { TelegramMessenger } from '@/lib/feedback/service'

type RawMessage = { message_id?: number; text?: string; chat?: { id?: string | number; type?: string }; reply_to_message?: unknown }

export type ParsedCommunityUpdate =
  | { kind: 'message'; chatId: string; messageId: number; privateChat: boolean; text: string; addressed: boolean }
  | { kind: 'callback'; callbackId: string; chatId: string; messageId: number; data: string }
  | { kind: 'ignore' }

function object(value: unknown): Record<string, unknown> { return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {} }

export function parseCommunityUpdate(update: unknown, username = ''): ParsedCommunityUpdate {
  const callback = object(object(update).callback_query)
  const callbackMessage = object(callback.message)
  if (typeof callback.id === 'string' && typeof callback.data === 'string' && callbackMessage.chat && Number.isInteger(callbackMessage.message_id)) {
    const chat = object(callbackMessage.chat)
    if (chat.id !== undefined) return { kind: 'callback', callbackId: callback.id, chatId: String(chat.id), messageId: callbackMessage.message_id as number, data: callback.data.slice(0, 160) }
  }
  const message = object(object(update).message) as RawMessage
  if (message.chat?.id === undefined || !Number.isInteger(message.message_id) || !message.text?.trim()) return { kind: 'ignore' }
  const text = message.text.trim()
  const privateChat = message.chat.type === 'private'
  const commandAddressed = /^\/(start|help|report)(?:@\w+)?\b/i.test(text)
  const mentioned = username ? text.toLowerCase().includes(`@${username.replace(/^@/, '').toLowerCase()}`) : false
  const addressed = privateChat || Boolean(message.reply_to_message) || commandAddressed || mentioned
  if (!addressed) return { kind: 'ignore' }
  return { kind: 'message', chatId: String(message.chat.id), messageId: message.message_id as number, privateChat, text, addressed }
}

export interface CommunityDependencies {
  messenger: TelegramMessenger
  feedbackBotUsername?: string
}

function feedbackLink(username: string, type: string): TelegramReplyMarkup {
  return inlineKeyboard([[{ text: 'Open Feedback Bot', url: deepLink(username, isFeedbackType(type) ? type : 'bug') }]])
}

export async function handleCommunityUpdate(update: ParsedCommunityUpdate, dependencies: CommunityDependencies): Promise<void> {
  if (update.kind === 'ignore') return
  if (update.kind === 'callback') {
    const [, action, type] = update.data.split(':')
    if (action === 'report') {
      const username = dependencies.feedbackBotUsername
      await dependencies.messenger.answerCallbackQuery?.(update.callbackId, username ? 'Open the private Feedback Bot to continue.' : 'Feedback Bot is not configured yet.')
      if (!username) { await dependencies.messenger.sendMessage(update.chatId, 'Feedback Bot is not configured yet. Please contact a VEYRA admin.'); return }
      await dependencies.messenger.sendMessage(update.chatId, 'Open the private Feedback Bot to send your report safely.', { replyMarkup: feedbackLink(username, type ?? 'bug') })
      return
    }
    const answers: Record<string, string> = {
      discover: 'Try Discover for trending and curated VEYRA picks.',
      search: 'Use VEYRA Search to find a movie, series, or anime by title.',
      movies: 'Browse Movies for popular, new, and top-rated films.',
      series: 'Browse Series for TV shows and seasonal releases.',
      anime: 'Use Anime to explore anime discovery and search.',
      help: 'I can help you discover VEYRA content. Use Search, Discover, or Report if something is not working.',
    }
    const answer = answers[action ?? 'help'] ?? answers.help
    await dependencies.messenger.answerCallbackQuery?.(update.callbackId, answer)
    if (!dependencies.messenger.answerCallbackQuery) {
      await dependencies.messenger.sendMessage(update.chatId, answer, { replyMarkup: communityKeyboard(dependencies.feedbackBotUsername) })
    }
    return
  }
  const command = update.text.match(/^\/(start|help|report)\b/i)?.[1]?.toLowerCase()
  if (command === 'start' || command === 'help' || command === 'report') {
    await dependencies.messenger.sendMessage(update.chatId, 'Welcome to VEYRA Community 🎬\n\nChoose what you need:', { replyMarkup: communityKeyboard(dependencies.feedbackBotUsername) })
    return
  }
  const text = update.text.replace(/@\w+/g, '').trim()
  const feedbackUsername = dependencies.feedbackBotUsername
  if (/\b(bug|problem|broken|not working|شكوى|مشكلة|لا يعمل|problème)\b/i.test(text)) {
    await dependencies.messenger.sendMessage(update.chatId, feedbackUsername ? 'Open the private Feedback Bot to send your report safely.' : 'Feedback Bot is not configured yet. Please contact a VEYRA admin.', { replyMarkup: feedbackUsername ? feedbackLink(feedbackUsername, 'bug') : undefined })
    return
  }
  await dependencies.messenger.sendMessage(update.chatId, 'Choose what you need:', { replyMarkup: communityKeyboard(feedbackUsername) })
}

export function createCommunityTelegramDependencies(env: Record<string, string | undefined> = process.env): CommunityDependencies {
  return { messenger: createTelegramClient(env, fetch, 'TELEGRAM_COMMUNITY_BOT_TOKEN'), feedbackBotUsername: env.TELEGRAM_FEEDBACK_BOT_USERNAME }
}

export function formatCommunityWebhookError(error: unknown): string { return formatTelegramWebhookError(error) }
