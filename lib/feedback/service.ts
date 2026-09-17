import { randomUUID } from 'node:crypto'
import { deterministicFallback } from './normalize'
import type { AIRouter, AIRouterResult } from '@/lib/ai/router'
import type { AIProviderStatus } from '@/lib/ai/types'
import type { AIStatus, FeedbackRecord, GitHubStatus, NormalizedFeedback, SanitizedFeedback } from './types'

export interface FeedbackRepository {
  create(seed: Omit<FeedbackRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeedbackRecord>
  update(id: string, patch: Partial<FeedbackRecord>): Promise<FeedbackRecord>
  getByTicket(ticket: string): Promise<FeedbackRecord | null>
}

export interface IssueTracker {
  createIssue(record: FeedbackRecord): Promise<{ number: number; url: string }>
  updateIssue?(number: number, record: FeedbackRecord): Promise<{ number: number; url: string }>
}

export interface TelegramMessenger {
  sendMessage(chatId: string, text: string): Promise<void>
}

export interface FeedbackSubmission {
  chatId: string
  messageId: number
  input: SanitizedFeedback
}

export interface FeedbackDependencies {
  repository: FeedbackRepository
  router: Pick<AIRouter, 'normalize'>
  issueTracker: IssueTracker
  messenger: TelegramMessenger
  now?: () => Date
  nextTicket?: () => string
  log?: (event: string, details?: Record<string, unknown>) => void
}

export interface FeedbackResult {
  accepted: boolean
  ticket: string
  aiStatus: AIStatus
  githubStatus: GitHubStatus
  feedback: NormalizedFeedback
  githubIssueNumber: number | null
  githubIssueUrl: string | null
}

const fallbackResult = (input: SanitizedFeedback): AIRouterResult => ({
  success: true, provider: 'deterministic', model: null, fallbackDepth: 0, latencyMs: 0, aiProcessed: false, feedback: deterministicFallback(input),
})

function ticketId(): string {
  return `VEYRA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`
}

function acknowledgement(result: FeedbackResult): string {
  return result.aiStatus === 'AI_UNAVAILABLE'
    ? `Thanks — report ${result.ticket} is safely stored. AI enrichment is currently unavailable, but the engineering ticket is ready for later reprocessing.`
    : `Thanks — report ${result.ticket} is safely stored and sent to the VEYRA engineering queue.`
}

export async function processFeedback(submission: FeedbackSubmission, dependencies: FeedbackDependencies): Promise<FeedbackResult> {
  const ticket = dependencies.nextTicket?.() ?? ticketId()
  const seed: Omit<FeedbackRecord, 'id' | 'createdAt' | 'updatedAt'> = {
    ticket,
    chatId: submission.chatId,
    messageId: submission.messageId,
    input: submission.input,
    normalized: deterministicFallback(submission.input),
    aiStatus: 'AI_PENDING',
    aiProvider: null,
    aiModel: null,
    fallbackDepth: 0,
    githubStatus: 'PENDING',
    githubIssueNumber: null,
    githubIssueUrl: null,
  }
  const stored = await dependencies.repository.create(seed)
  let aiResult: AIRouterResult
  try {
    aiResult = await dependencies.router.normalize(submission.input)
  } catch (error) {
    dependencies.log?.('feedback.ai_failed', { ticket, reason: error instanceof Error ? error.name : 'unknown' })
    aiResult = fallbackResult(submission.input)
  }

  const aiStatus: AIStatus = aiResult.aiProcessed ? 'SUCCESS' : 'AI_UNAVAILABLE'
  const aiRecord: FeedbackRecord = { ...stored, normalized: aiResult.feedback, aiStatus, aiProvider: aiResult.provider === 'deterministic' ? null : aiResult.provider, aiModel: aiResult.model, fallbackDepth: aiResult.fallbackDepth }
  let current: FeedbackRecord = aiRecord
  try {
    current = await dependencies.repository.update(stored.id, { normalized: aiRecord.normalized, aiStatus, aiProvider: aiRecord.aiProvider, aiModel: aiRecord.aiModel, fallbackDepth: aiRecord.fallbackDepth })
  } catch (error) {
    dependencies.log?.('feedback.ai_state_update_failed', { ticket, reason: error instanceof Error ? error.name : 'unknown' })
  }

  let githubStatus: GitHubStatus = 'PENDING'
  let githubIssueNumber: number | null = null
  let githubIssueUrl: string | null = null
  try {
    const issue = await dependencies.issueTracker.createIssue({ ...current, normalized: aiRecord.normalized, aiStatus, aiProvider: aiRecord.aiProvider, aiModel: aiRecord.aiModel, fallbackDepth: aiRecord.fallbackDepth })
    githubStatus = 'CREATED'
    githubIssueNumber = issue.number
    githubIssueUrl = issue.url
  } catch (error) {
    dependencies.log?.('feedback.github_failed', { ticket, reason: error instanceof Error ? error.name : 'unknown' })
  }

  try {
    await dependencies.repository.update(stored.id, { githubStatus, githubIssueNumber, githubIssueUrl })
  } catch (error) {
    dependencies.log?.('feedback.github_state_update_failed', { ticket, reason: error instanceof Error ? error.name : 'unknown' })
  }

  const result: FeedbackResult = { accepted: true, ticket, aiStatus, githubStatus, feedback: aiRecord.normalized, githubIssueNumber, githubIssueUrl }
  try {
    await dependencies.messenger.sendMessage(submission.chatId, acknowledgement(result))
  } catch (error) {
    dependencies.log?.('feedback.ack_failed', { ticket, reason: error instanceof Error ? error.name : 'unknown' })
  }
  return result
}

export async function reprocessFeedback(record: FeedbackRecord, dependencies: FeedbackDependencies): Promise<FeedbackResult> {
  const aiResult = await dependencies.router.normalize(record.input)
  const aiStatus: AIStatus = aiResult.aiProcessed ? 'SUCCESS' : 'AI_UNAVAILABLE'
  const updated = await dependencies.repository.update(record.id, { normalized: aiResult.feedback, aiStatus, aiProvider: aiResult.provider === 'deterministic' ? null : aiResult.provider, aiModel: aiResult.model, fallbackDepth: aiResult.fallbackDepth })
  let githubStatus: GitHubStatus = updated.githubStatus
  let issueNumber = updated.githubIssueNumber
  let issueUrl = updated.githubIssueUrl
  if (issueNumber && dependencies.issueTracker.updateIssue) {
    const issue = await dependencies.issueTracker.updateIssue(issueNumber, { ...updated, normalized: aiResult.feedback, aiStatus })
    issueUrl = issue.url
    githubStatus = 'CREATED'
  } else if (!issueNumber) {
    const issue = await dependencies.issueTracker.createIssue({ ...updated, normalized: aiResult.feedback, aiStatus })
    issueNumber = issue.number
    issueUrl = issue.url
    githubStatus = 'CREATED'
  }
  await dependencies.repository.update(record.id, { githubStatus, githubIssueNumber: issueNumber, githubIssueUrl: issueUrl })
  return { accepted: true, ticket: record.ticket, aiStatus, githubStatus, feedback: aiResult.feedback, githubIssueNumber: issueNumber, githubIssueUrl: issueUrl }
}

export function statusLines(statuses: AIProviderStatus[]): string[] {
  return statuses.map((status) => `${status.health === 'healthy' ? '🟢' : status.health === 'cooldown' ? '🟡' : '⚪'} ${status.provider} — ${status.health}`)
}
