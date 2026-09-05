import { getAIRouter, type AIRouter } from '@/lib/ai/router'
import type { AIProviderStatus } from '@/lib/ai/types'
import { sanitizeFeedback } from '@/lib/feedback/normalize'
import { createGitHubIssueTracker } from '@/lib/feedback/github'
import { createFeedbackRepository } from '@/lib/feedback/supabase-repository'
import { processFeedback, reprocessFeedback, type FeedbackDependencies, type IssueTracker, type TelegramMessenger } from '@/lib/feedback/service'

type TelegramMessage = { message_id?: number; chat?: { id?: number | string; type?: string }; text?: string }
type Environment = Record<string, string | undefined>

export type ParsedTelegramUpdate =
  | { kind: 'report'; chatId: string; messageId: number; feedback: ReturnType<typeof sanitizeFeedback> }
  | { kind: 'command'; chatId: string; messageId: number; privateChat: boolean; command: 'start' | 'help' | 'aistatus' | 'reprocess'; argument: string }
  | { kind: 'ignore' }

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function parseTelegramUpdate(update: unknown): ParsedTelegramUpdate {
  const message = object(object(update).message) as TelegramMessage
  const chatId = message.chat?.id
  const messageId = message.message_id
  const text = message.text?.trim()
  if (chatId === undefined || !Number.isInteger(messageId) || !text) return { kind: 'ignore' }
  const validMessageId = messageId as number
  const normalized = text.match(/^\/?([a-z]+)(?:@[^\s]+)?(?:\s+([\s\S]*))?$/i)
  const command = normalized?.[1]?.toLowerCase()
  const argument = normalized?.[2]?.trim() ?? ''
  const privateChat = message.chat?.type === 'private'
  if (text.startsWith('/') && !normalized) return { kind: 'ignore' }
  if (command === 'start' || command === 'help' || command === 'aistatus') return { kind: 'command', chatId: String(chatId), messageId: validMessageId, privateChat, command, argument }
  if (command === 'reprocess') return { kind: 'command', chatId: String(chatId), messageId: validMessageId, privateChat, command, argument }
  const type = command === 'bug' || command === 'complaint' || command === 'feature' || command === 'playback' || command === 'ux' ? command : 'bug'
  const description = command ? argument || text : text
  const route = description.match(/\/(?:watch|movie|tv|search|discover|streaming|providers?)[^\s),]*/i)?.[0]
  return {
    kind: 'report',
    chatId: String(chatId),
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

export function createTelegramClient(env: Environment = process.env, fetchImpl: typeof fetch = fetch): TelegramMessenger {
  return {
    async sendMessage(chatId, text) {
      const token = env.TELEGRAM_BOT_TOKEN
      if (!token) throw new Error('Telegram bot is not configured')
      const response = await fetchImpl(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) })
      if (!response.ok) throw new Error(`Telegram acknowledgement failed (${response.status})`)
    },
  }
}

export interface TelegramHandlerDependencies extends Omit<FeedbackDependencies, 'router'> {
  router: Pick<AIRouter, 'normalize' | 'getStatus'>
  env?: Environment
}

export async function handleTelegramUpdate(update: ParsedTelegramUpdate, dependencies: TelegramHandlerDependencies): Promise<void> {
  if (update.kind === 'ignore') return
  const env = dependencies.env ?? process.env
  if (update.kind === 'report') {
    await processFeedback({ chatId: update.chatId, messageId: update.messageId, input: update.feedback }, dependencies)
    return
  }
  if (update.command === 'start' || update.command === 'help') {
    await dependencies.messenger.sendMessage(update.chatId, 'Send /bug, /playback, /ux, /feature, or /complaint followed by what happened. Every valid report is stored before optional AI enrichment.')
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
  return { env, repository: lazyRepository, router, issueTracker, messenger: createTelegramClient(env) }
}
