import { getAIRouter, type AIRouter } from '@/lib/ai/router'
import type { AIProviderStatus } from '@/lib/ai/types'
import { sanitizeFeedback } from '@/lib/feedback/normalize'
import { createGitHubIssueTracker } from '@/lib/feedback/github'
import { createFeedbackRepository } from '@/lib/feedback/supabase-repository'
import { processFeedback, reprocessFeedback, type FeedbackDependencies, type IssueTracker, type TelegramMessenger } from '@/lib/feedback/service'
import { adminKeyboard, feedbackContextKeyboard, feedbackReviewKeyboard, feedbackTypeKeyboard, isFeedbackType, type TelegramReplyMarkup } from '@/lib/telegram-ui'
import { createMemoryTelegramSessionStore, createTelegramSessionStore, type TelegramFeedbackSession, type TelegramSessionStore } from '@/lib/telegram-sessions'

type TelegramMessage = { message_id?: number; chat?: { id?: number | string; type?: string }; text?: string; from?: { id?: number | string; username?: string; first_name?: string; last_name?: string } }
type TelegramCallbackQuery = { id?: string; data?: string; from?: { id?: number | string }; message?: TelegramMessage }
type Environment = Record<string, string | undefined>
type FeedbackEntry = { type: ReturnType<typeof sanitizeFeedback>['type']; category: string; label: string; prompt: string }

export type ParsedTelegramUpdate =
  | { kind: 'report'; chatId: string; userId: string; messageId: number; feedback: ReturnType<typeof sanitizeFeedback> }
  | { kind: 'command'; chatId: string; userId: string; messageId: number; privateChat: boolean; command: 'start' | 'help' | 'aistatus' | 'reprocess'; argument: string }
  | { kind: 'callback'; callbackId: string; chatId: string; userId: string; messageId: number; privateChat: boolean; data: string }
  | { kind: 'ignore' }

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function parseTelegramUpdate(update: unknown): ParsedTelegramUpdate {
  const callback = object(object(update).callback_query) as TelegramCallbackQuery
  if (callback.id && callback.data && callback.message?.chat?.id !== undefined && Number.isInteger(callback.message.message_id) && callback.from?.id !== undefined) {
    return { kind: 'callback', callbackId: callback.id, chatId: String(callback.message.chat.id), userId: String(callback.from.id), messageId: callback.message.message_id as number, privateChat: callback.message.chat.type === 'private', data: callback.data.slice(0, 160) }
  }
  const message = object(object(update).message) as TelegramMessage
  const chatId = message.chat?.id
  const messageId = message.message_id
  const text = message.text?.trim()
  if (chatId === undefined || !Number.isInteger(messageId) || !text) return { kind: 'ignore' }
  const validMessageId = messageId as number
  const normalized = text.startsWith('/') ? text.match(/^\/([a-z]+)(?:@[^\s]+)?(?:\s+([\s\S]*))?$/i) : null
  const command = normalized?.[1]?.toLowerCase()
  const argument = normalized?.[2]?.trim() ?? ''
  const privateChat = message.chat?.type === 'private'
  if (text.startsWith('/') && !normalized) return { kind: 'ignore' }
  const userId = message.from?.id === undefined ? String(chatId) : String(message.from.id)
  if (command === 'start' || command === 'help' || command === 'aistatus') return { kind: 'command', chatId: String(chatId), userId, messageId: validMessageId, privateChat, command, argument }
  if (command === 'reprocess') return { kind: 'command', chatId: String(chatId), userId, messageId: validMessageId, privateChat, command, argument }
  const type = command === 'bug' || command === 'complaint' || command === 'feature' || command === 'playback' || command === 'ux' ? command : 'bug'
  const description = command ? argument || text : text
  const route = description.match(/\/(?:watch|movie|tv|search|discover|streaming|providers?)[^\s),]*/i)?.[0]
  return {
    kind: 'report',
    chatId: String(chatId),
    userId,
    messageId: validMessageId,
    feedback: sanitizeFeedback({ description, type, category: type === 'playback' ? 'streaming' : type, severity: type === 'feature' ? 'P3' : 'P2', route }),
  }
}

export function isAdminChat(chatId: string, env: Environment = process.env): boolean {
  return (env.TELEGRAM_ADMIN_CHAT_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean).includes(chatId)
}

function providerLabel(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

export function formatAIStatus(statuses: AIProviderStatus[]): string {
  const lines = statuses.map((status) => {
    const label = !status.enabled && !status.lastFailure ? 'not configured' : status.health
    return `${status.health === 'healthy' ? '🟢' : status.health === 'cooldown' ? '🟡' : '⚪'} ${providerLabel(status.provider)} — ${label}`
  })
  return ['VEYRA AI Router', '', ...lines, '⚪ Deterministic — always available'].join('\n')
}

export function formatTelegramWebhookError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.replace(/(https?:\/\/[^\s/]+\/bot\d+):[^\s/]+/gi, '$1:[REDACTED]').slice(0, 240)
}

export function createTelegramClient(env: Environment = process.env, fetchImpl: typeof fetch = fetch, tokenName = 'TELEGRAM_BOT_TOKEN'): TelegramMessenger {
  const call = async (token: string, method: string, body: Record<string, unknown>) => {
    const response = await fetchImpl(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error(`Telegram ${method} failed (${response.status})`)
  }
  return {
    async sendMessage(chatId, text, options) {
      const token = env[tokenName] ?? (tokenName === 'TELEGRAM_FEEDBACK_BOT_TOKEN' ? env.TELEGRAM_BOT_TOKEN : undefined)
      if (!token) throw new Error('Telegram bot is not configured')
      await call(token, 'sendMessage', { chat_id: chatId, text, ...(options?.replyMarkup ? { reply_markup: options.replyMarkup } : {}) })
    },
    async answerCallbackQuery(callbackId, text) {
      const token = env[tokenName] ?? (tokenName === 'TELEGRAM_FEEDBACK_BOT_TOKEN' ? env.TELEGRAM_BOT_TOKEN : undefined)
      if (!token) throw new Error('Telegram bot is not configured')
      await call(token, 'answerCallbackQuery', { callback_query_id: callbackId, ...(text ? { text } : {}) })
    },
    async editMessageText(chatId, messageId, text, options) {
      const token = env[tokenName] ?? (tokenName === 'TELEGRAM_FEEDBACK_BOT_TOKEN' ? env.TELEGRAM_BOT_TOKEN : undefined)
      if (!token) throw new Error('Telegram bot is not configured')
      await call(token, 'editMessageText', { chat_id: chatId, message_id: messageId, text, ...(options?.replyMarkup ? { reply_markup: options.replyMarkup } : {}) })
    },
  }
}

export interface TelegramHandlerDependencies extends Omit<FeedbackDependencies, 'router'> {
  router: Pick<AIRouter, 'normalize' | 'getStatus'>
  env?: Environment
  sessionStore?: TelegramSessionStore
  adminUserIds?: string[]
  feedbackBotUsername?: string
}

function feedbackEntry(value?: string): FeedbackEntry | undefined {
  if (!value) return undefined
  const entries: Record<string, FeedbackEntry> = {
    bug: { type: 'bug', category: 'bug', label: 'bug', prompt: 'Describe what happened.' },
    playback: { type: 'playback', category: 'streaming', label: 'playback issue', prompt: 'Tell me what happened during playback. Include the title and device if you can.' },
    ux: { type: 'ux', category: 'ux', label: 'UX issue', prompt: 'Describe the confusing screen or action.' },
    complaint: { type: 'complaint', category: 'complaint', label: 'complaint', prompt: 'Tell me what went wrong.' },
    feature: { type: 'feature', category: 'feature', label: 'feature request', prompt: 'Describe the feature you want VEYRA to add.' },
    'missing-movie': { type: 'feature', category: 'missing_movie', label: 'missing movie request', prompt: 'Which movie is missing? Send the title, year, and any details you know.' },
    'missing-series': { type: 'feature', category: 'missing_series', label: 'missing series request', prompt: 'Which series is missing? Send the title, season, year, and any details you know.' },
    'missing-anime': { type: 'feature', category: 'missing_anime', label: 'missing anime request', prompt: 'Which anime is missing? Send the title, season, year, and any details you know.' },
    missing_movie: { type: 'feature', category: 'missing_movie', label: 'missing movie request', prompt: 'Which movie is missing? Send the title, year, and any details you know.' },
    missing_series: { type: 'feature', category: 'missing_series', label: 'missing series request', prompt: 'Which series is missing? Send the title, season, year, and any details you know.' },
    missing_anime: { type: 'feature', category: 'missing_anime', label: 'missing anime request', prompt: 'Which anime is missing? Send the title, season, year, and any details you know.' },
    recommendation: { type: 'feature', category: 'recommendation', label: 'recommendation request', prompt: 'What kind of recommendation do you want? Tell me genre, mood, language, or examples you like.' },
  }
  return entries[value.toLowerCase()]
}

function categoryLabel(category?: string): string {
  return (category ?? '').replace(/_/g, ' ') || 'Not provided'
}

function feedbackPrompt(session: TelegramFeedbackSession): { text: string; replyMarkup?: TelegramReplyMarkup } {
  if (session.step === 'type') return { text: 'What would you like to report?', replyMarkup: feedbackTypeKeyboard() }
  if (session.step === 'description') return { text: feedbackEntry(session.draft.category)?.prompt ?? 'Tell me what happened. Please include the title or page if relevant.' }
  if (session.step === 'context') return { text: 'Send the VEYRA page URL or title (optional), or skip it.', replyMarkup: feedbackContextKeyboard() }
  return { text: `Please review your report:\n\nType: ${session.draft.type}\nRequest: ${categoryLabel(session.draft.category)}\nDescription: ${session.draft.description}\nContext: ${session.draft.route || 'Not provided'}\n\nSubmit it?`, replyMarkup: feedbackReviewKeyboard() }
}

async function beginFeedbackSession(update: Extract<ParsedTelegramUpdate, { kind: 'command' }>, dependencies: TelegramHandlerDependencies, type?: string): Promise<void> {
  const store = dependencies.sessionStore
  if (!store) {
    await dependencies.messenger.sendMessage(update.chatId, 'Send /bug, /playback, /ux, /feature, or /complaint followed by what happened.')
    return
  }
  const selectedEntry = feedbackEntry(type)
  const session: TelegramFeedbackSession = { bot: 'feedback', chatId: update.chatId, userId: update.userId, step: selectedEntry ? 'description' : 'type', draft: selectedEntry ? { type: selectedEntry.type, category: selectedEntry.category } : {}, updatedAt: new Date().toISOString() }
  await store.save(session)
  const prompt = feedbackPrompt(session)
  await dependencies.messenger.sendMessage(update.chatId, selectedEntry ? `You selected ${selectedEntry.label}.\n\n${prompt.text}` : prompt.text, { replyMarkup: prompt.replyMarkup })
}

function adminUserAllowed(userId: string, dependencies: TelegramHandlerDependencies): boolean {
  const configured = dependencies.adminUserIds ?? (dependencies.env?.TELEGRAM_ADMIN_USER_IDS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
  return configured.length === 0 || configured.includes(userId)
}

function adminCard(ticket: string, feedback: ReturnType<typeof sanitizeFeedback>, aiStatus: string, githubStatus: string) {
  return [`🆕 VEYRA Report`, `Ticket: ${ticket}`, `Type: ${feedback.type} · Severity: ${feedback.severity}`, `Status: ${aiStatus} · GitHub: ${githubStatus}`, '', `Description: ${feedback.description}`, `Route: ${feedback.route}`].join('\n')
}

async function notifyAdmins(ticket: string, feedback: ReturnType<typeof sanitizeFeedback>, aiStatus: string, githubStatus: string, dependencies: TelegramHandlerDependencies): Promise<void> {
  for (const adminChatId of (dependencies.env?.TELEGRAM_ADMIN_CHAT_IDS ?? '').split(',').map((item) => item.trim()).filter(Boolean)) {
    try { await dependencies.messenger.sendMessage(adminChatId, adminCard(ticket, feedback, aiStatus, githubStatus), { replyMarkup: adminKeyboard(ticket) }) }
    catch (error) { dependencies.log?.('telegram.admin_notification_failed', { ticket, reason: error instanceof Error ? error.name : 'unknown' }) }
  }
}

async function handleCallback(update: Extract<ParsedTelegramUpdate, { kind: 'callback' }>, dependencies: TelegramHandlerDependencies): Promise<void> {
  await dependencies.messenger.answerCallbackQuery?.(update.callbackId)
  const [scope, action, value] = update.data.split(':')
  if (scope === 'feedback' && update.privateChat && dependencies.sessionStore) {
    const session = await dependencies.sessionStore.get('feedback', update.chatId, update.userId)
    if (action === 'cancel') { await dependencies.sessionStore.clear('feedback', update.chatId, update.userId); await dependencies.messenger.sendMessage(update.chatId, 'Cancelled. Use /start whenever you want to send a report.'); return }
    if (action === 'type' && value && isFeedbackType(value)) {
      const entry = feedbackEntry(value)
      const next = { bot: 'feedback' as const, chatId: update.chatId, userId: update.userId, step: 'description' as const, draft: { ...(session?.draft ?? {}), type: value, category: entry?.category ?? value }, updatedAt: new Date().toISOString() }
      await dependencies.sessionStore.save(next); await dependencies.messenger.sendMessage(update.chatId, 'Describe what happened.'); return
    }
    if (!session) { await dependencies.messenger.sendMessage(update.chatId, 'This report session expired. Use /start to begin again.', { replyMarkup: feedbackTypeKeyboard() }); return }
    if (action === 'skip-context') { const next = { ...session, step: 'review' as const, updatedAt: new Date().toISOString() }; await dependencies.sessionStore.save(next); const prompt = feedbackPrompt(next); await dependencies.messenger.sendMessage(update.chatId, prompt.text, { replyMarkup: prompt.replyMarkup }); return }
    if (action === 'edit') { const next = { ...session, step: 'description' as const, updatedAt: new Date().toISOString() }; await dependencies.sessionStore.save(next); await dependencies.messenger.sendMessage(update.chatId, 'Send the corrected description.'); return }
    if (action === 'submit' && session.step === 'review' && session.draft.type && session.draft.description) {
      await dependencies.sessionStore.clear('feedback', update.chatId, update.userId)
      const input = sanitizeFeedback({ type: session.draft.type, description: session.draft.description, route: session.draft.route, category: session.draft.category ?? (session.draft.type === 'playback' ? 'streaming' : session.draft.type), severity: session.draft.type === 'feature' ? 'P3' : 'P2' })
      const result = await processFeedback({ chatId: update.chatId, messageId: session.draft.messageId ?? update.messageId, input }, dependencies)
      if (!result.duplicate) await notifyAdmins(result.ticket, input, result.aiStatus, result.githubStatus, dependencies)
      return
    }
  }
  if (scope === 'admin' && update.privateChat && isAdminChat(update.chatId, dependencies.env) && adminUserAllowed(update.userId, dependencies)) {
    const ticket = value ? decodeURIComponent(value) : ''
    const record = ticket ? await dependencies.repository.getByTicket(ticket) : null
    if (!record) { await dependencies.messenger.sendMessage(update.chatId, 'Report not found or already removed.'); return }
    if (action === 'reprocess') { const result = await reprocessFeedback(record, dependencies); await dependencies.messenger.sendMessage(update.chatId, `AI enrichment for ${result.ticket}: ${result.aiStatus}.`); return }
    if (action === 'resolve' || action === 'close' || action === 'need-info') { await dependencies.repository.update(record.id, { publicStatus: action === 'resolve' ? 'RESOLVED' : action === 'close' ? 'CLOSED' : 'NEED_INFO' }); await dependencies.messenger.sendMessage(update.chatId, `${ticket}: ${action === 'need-info' ? 'information requested' : action}.`); return }
    if (action === 'github') { const result = await reprocessFeedback(record, dependencies); await dependencies.messenger.sendMessage(update.chatId, `GitHub status for ${result.ticket}: ${result.githubStatus}.`); return }
  }
}

export async function handleTelegramUpdate(update: ParsedTelegramUpdate, dependencies: TelegramHandlerDependencies): Promise<void> {
  if (update.kind === 'ignore') return
  const env = dependencies.env ?? process.env
  if (update.kind === 'callback') { await handleCallback(update, dependencies); return }
  if (update.kind === 'report') {
    let session: TelegramFeedbackSession | null = null
    try { session = dependencies.sessionStore ? await dependencies.sessionStore.get('feedback', update.chatId, update.userId) : null } catch (error) { dependencies.log?.('telegram.session_read_failed', { reason: error instanceof Error ? error.name : 'unknown' }) }
    if (session) {
      const now = new Date().toISOString()
      if (session.step === 'description') {
        const description = update.feedback.description.trim()
        if (!description || description === 'Unknown — not provided by the user.') {
          await dependencies.messenger.sendMessage(update.chatId, feedbackPrompt(session).text)
          return
        }
        const next = { ...session, step: 'context' as const, draft: { ...session.draft, description, messageId: update.messageId }, updatedAt: now }
        await dependencies.sessionStore!.save(next)
        const prompt = feedbackPrompt(next)
        await dependencies.messenger.sendMessage(update.chatId, prompt.text, { replyMarkup: prompt.replyMarkup })
        return
      }
      if (session.step === 'context') {
        if (!session.draft.description?.trim()) {
          const next = { ...session, step: 'description' as const, updatedAt: now }
          await dependencies.sessionStore!.save(next)
          await dependencies.messenger.sendMessage(update.chatId, 'Your description was missing. Please describe what happened.')
          return
        }
        const next = { ...session, step: 'review' as const, draft: { ...session.draft, route: update.feedback.description }, updatedAt: now }
        await dependencies.sessionStore!.save(next)
        const prompt = feedbackPrompt(next)
        await dependencies.messenger.sendMessage(update.chatId, prompt.text, { replyMarkup: prompt.replyMarkup })
        return
      }
    }
    const result = await processFeedback({ chatId: update.chatId, messageId: update.messageId, input: update.feedback }, dependencies)
    if (!result.duplicate) await notifyAdmins(result.ticket, update.feedback, result.aiStatus, result.githubStatus, dependencies)
    return
  }
  if (update.command === 'start' || update.command === 'help') {
    if (update.privateChat) { const type = update.command === 'start' ? update.argument.split(/\s+/)[0] : undefined; await beginFeedbackSession(update, dependencies, type); return }
    await dependencies.messenger.sendMessage(update.chatId, 'To send a private VEYRA report, open the Feedback Bot and choose a report type.')
    return
  }
  if (!update.privateChat || !isAdminChat(update.chatId, env)) {
    await dependencies.messenger.sendMessage(update.chatId, 'This command is available to VEYRA administrators only.')
    return
  }
  if (update.command === 'aistatus') {
    await dependencies.messenger.sendMessage(update.chatId, formatAIStatus(dependencies.router.getStatus()))
    return
  }
  if (!update.argument) {
    await dependencies.messenger.sendMessage(update.chatId, 'Usage: /reprocess VEYRA-YYYYMMDD-XXXXXXXX')
    return
  }
  const record = await dependencies.repository.getByTicket(update.argument)
  if (!record) {
    await dependencies.messenger.sendMessage(update.chatId, `No report found for ${update.argument}.`)
    return
  }
  const result = await reprocessFeedback(record, dependencies)
  await dependencies.messenger.sendMessage(update.chatId, `AI enrichment for ${result.ticket}: ${result.aiStatus}.`)
}

export function createDefaultTelegramDependencies(env: Environment = process.env): TelegramHandlerDependencies {
  let repository: ReturnType<typeof createFeedbackRepository> | undefined
  const getRepository = () => repository ??= createFeedbackRepository(env)
  const lazyRepository: TelegramHandlerDependencies['repository'] = {
    create: (seed) => getRepository().create(seed),
    update: (id, patch) => getRepository().update(id, patch),
    getByTicket: (ticket) => getRepository().getByTicket(ticket),
  }
  const router = getAIRouter()
  let issueTracker: IssueTracker
  try { issueTracker = createGitHubIssueTracker(env) } catch { issueTracker = { createIssue: async () => { throw new Error('GitHub issue integration is unavailable') } } }
  const memoryStore = createMemoryTelegramSessionStore()
  let sessionStore: TelegramSessionStore
  try {
    const persistentStore = createTelegramSessionStore(env)
    sessionStore = {
      async get(bot, chatId, userId) { try { return await persistentStore.get(bot, chatId, userId) } catch { return memoryStore.get(bot, chatId, userId) } },
      async save(session) { try { await persistentStore.save(session) } catch { await memoryStore.save(session) } },
      async clear(bot, chatId, userId) { try { await persistentStore.clear(bot, chatId, userId) } catch { await memoryStore.clear(bot, chatId, userId) } },
    }
  } catch { sessionStore = memoryStore }
  return { env, repository: lazyRepository, router, issueTracker, messenger: createTelegramClient(env, fetch, 'TELEGRAM_FEEDBACK_BOT_TOKEN'), sessionStore }
}
