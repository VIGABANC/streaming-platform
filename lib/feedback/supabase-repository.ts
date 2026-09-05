import { createAdminClient } from '@/lib/supabase/admin'
import type { FeedbackRecord } from './types'
import type { FeedbackRepository } from './service'

type Row = {
  id: string
  ticket: string
  chat_id: string
  message_id: number
  input: FeedbackRecord['input']
  normalized: FeedbackRecord['normalized']
  ai_status: FeedbackRecord['aiStatus']
  ai_provider: string | null
  ai_model: string | null
  fallback_depth: number
  github_status: FeedbackRecord['githubStatus']
  github_issue_number: number | null
  github_issue_url: string | null
  created_at: string
  updated_at: string
}

function fromRow(row: Row): FeedbackRecord {
  return {
    id: row.id, ticket: row.ticket, chatId: row.chat_id, messageId: row.message_id,
    input: row.input, normalized: row.normalized, aiStatus: row.ai_status,
    aiProvider: row.ai_provider, aiModel: row.ai_model, fallbackDepth: row.fallback_depth,
    githubStatus: row.github_status, githubIssueNumber: row.github_issue_number,
    githubIssueUrl: row.github_issue_url, createdAt: row.created_at, updatedAt: row.updated_at,
  }
}

type SupabaseError = { code?: string; message?: string } | null

export function formatFeedbackStorageError(error: SupabaseError): string {
  const code = error?.code?.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32)
  const message = error?.message?.replace(/\s+/g, ' ').trim().slice(0, 180)
  if (code && message) return `Feedback storage operation failed (${code}): ${message}`
  if (message) return `Feedback storage operation failed: ${message}`
  return 'Feedback storage operation failed'
}

function safeError(error: SupabaseError): Error {
  return new Error(formatFeedbackStorageError(error))
}

export function createFeedbackRepository(env: Record<string, string | undefined> = process.env): FeedbackRepository {
  const client = createAdminClient(env)
  return {
    async create(seed) {
      const { data, error } = await client.from('feedback_reports').insert({
        ticket: seed.ticket, chat_id: seed.chatId, message_id: seed.messageId,
        input: seed.input, normalized: seed.normalized, ai_status: seed.aiStatus,
        ai_provider: seed.aiProvider, ai_model: seed.aiModel, fallback_depth: seed.fallbackDepth,
        github_status: seed.githubStatus, github_issue_number: seed.githubIssueNumber, github_issue_url: seed.githubIssueUrl,
      }).select('*').single()
      if (error || !data) throw safeError(error)
      return fromRow(data as Row)
    },
    async update(id, patch) {
      const values: Record<string, unknown> = {}
      if (patch.normalized) values.normalized = patch.normalized
      if (patch.aiStatus) values.ai_status = patch.aiStatus
      if (patch.aiProvider !== undefined) values.ai_provider = patch.aiProvider
      if (patch.aiModel !== undefined) values.ai_model = patch.aiModel
      if (patch.fallbackDepth !== undefined) values.fallback_depth = patch.fallbackDepth
      if (patch.githubStatus) values.github_status = patch.githubStatus
      if (patch.githubIssueNumber !== undefined) values.github_issue_number = patch.githubIssueNumber
      if (patch.githubIssueUrl !== undefined) values.github_issue_url = patch.githubIssueUrl
      const { data, error } = await client.from('feedback_reports').update(values).eq('id', id).select('*').single()
      if (error || !data) throw safeError(error)
      return fromRow(data as Row)
    },
    async getByTicket(ticket) {
      const { data, error } = await client.from('feedback_reports').select('*').eq('ticket', ticket).maybeSingle()
      if (error) throw safeError(error)
      return data ? fromRow(data as Row) : null
    },
  }
}
