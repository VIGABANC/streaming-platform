import { z } from 'zod'

export const feedbackTypes = ['bug', 'complaint', 'feature', 'playback', 'ux'] as const
export const feedbackSeverities = ['P0', 'P1', 'P2', 'P3'] as const

export type FeedbackType = (typeof feedbackTypes)[number]
export type FeedbackSeverity = (typeof feedbackSeverities)[number]

export interface RawFeedback {
  description: string
  type?: FeedbackType
  category?: string
  severity?: FeedbackSeverity
  route?: string
  expectedBehavior?: string
  actualBehavior?: string
  environment?: Record<string, unknown>
  telegramUserId?: string
  telegramUsername?: string
  telegramFirstName?: string
  telegramLastName?: string
  adminChatId?: string
  ipAddress?: string
  screenshotReference?: string
}

export interface SanitizedFeedback {
  description: string
  type: FeedbackType
  category: string
  severity: FeedbackSeverity
  route: string
  expectedBehavior: string
  actualBehavior: string
  environment: Record<string, string>
}

export const normalizedFeedbackSchema = z.object({
  type: z.enum(feedbackTypes),
  title: z.string().trim().min(1).max(180),
  category: z.string().trim().min(1).max(80),
  severity: z.enum(feedbackSeverities),
  summary: z.string().trim().min(1).max(4000),
  route: z.string().trim().min(1).max(300),
  language: z.string().trim().min(1).max(40),
  reproduction_steps: z.array(z.string().trim().min(1).max(500)).max(12),
  expected_behavior: z.string().trim().min(1).max(2000),
  actual_behavior: z.string().trim().min(1).max(2000),
  environment: z.record(z.string(), z.string()).default({}),
  suspected_areas: z.array(z.string().trim().min(1).max(200)).max(12),
  missing_information: z.array(z.string().trim().min(1).max(300)).max(12),
  acceptance_criteria: z.array(z.string().trim().min(1).max(500)).max(12),
  fix_plan: z.array(z.string().trim().min(1).max(500)).max(12),
  developer_prompt: z.string().trim().min(1).max(8000),
  confidence: z.number().min(0).max(1),
}).strict()

export type NormalizedFeedback = z.infer<typeof normalizedFeedbackSchema>

export type AIStatus = 'AI_PENDING' | 'SUCCESS' | 'AI_UNAVAILABLE'
export type GitHubStatus = 'PENDING' | 'CREATED' | 'FAILED'

export interface FeedbackRecord {
  id: string
  ticket: string
  chatId: string
  messageId: number
  input: SanitizedFeedback
  normalized: NormalizedFeedback
  aiStatus: AIStatus
  aiProvider: string | null
  aiModel: string | null
  fallbackDepth: number
  githubStatus: GitHubStatus
  githubIssueNumber: number | null
  githubIssueUrl: string | null
  createdAt: string
  updatedAt: string
}
