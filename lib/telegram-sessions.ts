import { createAdminClient } from '@/lib/supabase/admin'
import type { FeedbackType } from '@/lib/feedback/types'

export type TelegramSessionStep = 'type' | 'description' | 'context' | 'review'

export interface TelegramFeedbackDraft {
  type?: FeedbackType
  category?: string
  description?: string
  route?: string
  messageId?: number
}

export interface TelegramFeedbackSession {
  bot: 'feedback'
  chatId: string
  userId: string
  step: TelegramSessionStep
  draft: TelegramFeedbackDraft
  updatedAt: string
}

export interface TelegramSessionStore {
  get(bot: 'feedback', chatId: string, userId: string): Promise<TelegramFeedbackSession | null>
  save(session: TelegramFeedbackSession): Promise<void>
  clear(bot: 'feedback', chatId: string, userId: string): Promise<void>
}

export function createMemoryTelegramSessionStore(): TelegramSessionStore {
  const sessions = new Map<string, TelegramFeedbackSession>()
  const key = (bot: string, chatId: string, userId: string) => `${bot}:${chatId}:${userId}`
  return {
    async get(bot, chatId, userId) {
      const session = sessions.get(key(bot, chatId, userId))
      if (!session) return null
      if (Date.now() - new Date(session.updatedAt).getTime() > 30 * 60 * 1000) {
        sessions.delete(key(bot, chatId, userId))
        return null
      }
      return session
    },
    async save(session) { sessions.set(key(session.bot, session.chatId, session.userId), session) },
    async clear(bot, chatId, userId) { sessions.delete(key(bot, chatId, userId)) },
  }
}

export function createTelegramSessionStore(env: Record<string, string | undefined> = process.env): TelegramSessionStore {
  const client = createAdminClient(env)
  return {
    async get(bot, chatId, userId) {
      const { data, error } = await client.from('telegram_feedback_sessions').select('*').eq('bot', bot).eq('chat_id', chatId).eq('user_id', userId).maybeSingle()
      if (error) throw new Error(`Telegram session read failed: ${error.message}`)
      if (!data) return null
      if (Date.now() - new Date(data.updated_at).getTime() > 30 * 60 * 1000) {
        await client.from('telegram_feedback_sessions').delete().eq('bot', bot).eq('chat_id', chatId).eq('user_id', userId)
        return null
      }
      return { bot: data.bot, chatId: data.chat_id, userId: data.user_id, step: data.step, draft: data.draft ?? {}, updatedAt: data.updated_at } as TelegramFeedbackSession
    },
    async save(session) {
      const { error } = await client.from('telegram_feedback_sessions').upsert({ bot: session.bot, chat_id: session.chatId, user_id: session.userId, step: session.step, draft: session.draft, updated_at: new Date().toISOString() })
      if (error) throw new Error(`Telegram session save failed: ${error.message}`)
    },
    async clear(bot, chatId, userId) {
      const { error } = await client.from('telegram_feedback_sessions').delete().eq('bot', bot).eq('chat_id', chatId).eq('user_id', userId)
      if (error) throw new Error(`Telegram session clear failed: ${error.message}`)
    },
  }
}
