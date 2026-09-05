import { z } from 'zod'
import {
  feedbackSeverities,
  feedbackTypes,
  normalizedFeedbackSchema,
  type NormalizedFeedback,
  type RawFeedback,
  type SanitizedFeedback,
} from './types'

const MAX_DESCRIPTION_LENGTH = 10_000
const DEFAULT_TEXT = 'Unknown — not provided by the user.'

function limit(value: string | undefined, max: number): string {
  return (value ?? '').trim().slice(0, max)
}

function redactSecrets(value: string): string {
  return value
    .replace(/(bearer\s+)[^\s,;]+/gi, '$1[REDACTED]')
    .replace(/((?:api[_-]?key|token|secret|password|authorization|cookie)\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]')
}

function safeEnvironment(environment: Record<string, unknown> | undefined): Record<string, string> {
  if (!environment) return {}
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(environment).slice(0, 12)) {
    if (!/^[a-z][a-z0-9_.-]{0,40}$/i.test(key)) continue
    if (/token|secret|password|cookie|authorization|api.?key/i.test(key)) continue
    const text = redactSecrets(String(value)).trim().slice(0, 300)
    if (text) result[key] = text
  }
  return result
}

export function sanitizeFeedback(input: RawFeedback): SanitizedFeedback {
  const type = feedbackTypes.includes(input.type ?? 'bug') ? (input.type ?? 'bug') : 'bug'
  const severity = feedbackSeverities.includes(input.severity ?? 'P2') ? (input.severity ?? 'P2') : 'P2'
  return {
    description: redactSecrets(limit(input.description, MAX_DESCRIPTION_LENGTH)) || DEFAULT_TEXT,
    type,
    category: limit(input.category, 80) || type,
    severity,
    route: limit(input.route, 300) || 'Unknown — route not provided.',
    expectedBehavior: redactSecrets(limit(input.expectedBehavior, 2_000)) || DEFAULT_TEXT,
    actualBehavior: redactSecrets(limit(input.actualBehavior, 2_000)) || limit(input.description, 2_000) || DEFAULT_TEXT,
    environment: safeEnvironment(input.environment),
  }
}

function titleCase(value: string): string {
  return value.replace(/[._-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function detectLanguage(text: string): string {
  if (/[\u0600-\u06ff]/u.test(text)) return 'Arabic'
  if (/\b(le|la|les|une|des|est|avec|pour|dans)\b/i.test(text)) return 'French'
  return 'English or unknown'
}

function fallbackTitle(input: SanitizedFeedback): string {
  const area = titleCase(input.category)
  if (input.type === 'playback') return `Playback — ${area} — user-reported loading problem`
  if (input.type === 'feature') return `Feature — ${area} — user request`
  if (input.type === 'complaint') return `Complaint — ${area} — user-reported issue`
  if (input.type === 'ux') return `UX — ${area} — user-reported issue`
  return `Bug — ${area} — user-reported issue`
}

export function deterministicFallback(input: SanitizedFeedback): NormalizedFeedback {
  const workflow = [
    'reproduce the issue',
    'inspect the relevant implementation',
    'inspect browser/runtime errors',
    'identify the root cause',
    'implement the smallest robust fix',
    'preserve unrelated behavior',
    'verify desktop and mobile',
    'test loading/error/empty states',
    'run lint, typecheck, tests, and the production build',
  ]
  return {
    type: input.type,
    title: fallbackTitle(input),
    category: input.category,
    severity: input.severity,
    summary: input.description,
    route: input.route,
    language: detectLanguage(input.description),
    reproduction_steps: [],
    expected_behavior: input.expectedBehavior,
    actual_behavior: input.actualBehavior,
    environment: input.environment,
    suspected_areas: [],
    missing_information: ['Reproduction result and browser/runtime evidence must be verified by the developer.'],
    acceptance_criteria: ['The reported behavior is reproduced, fixed, and verified without regressing unrelated behavior.'],
    fix_plan: workflow,
    developer_prompt: [
      'Investigate this VEYRA user-reported issue.',
      '',
      `Reported area: ${input.category}`,
      `Route: ${input.route}`,
      `Reported behavior: ${input.description}`,
      `Severity: ${input.severity}`,
      '',
      "The user's description is evidence of observed behavior only and does not establish the root cause.",
      '',
      'Required workflow:',
      ...workflow.map((step, index) => `${index + 1}. ${step}`),
    ].join('\n'),
    confidence: 0,
  }
}

function extractJsonObject(value: string): unknown {
  const withoutFence = value.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  try {
    return JSON.parse(withoutFence)
  } catch {
    const start = withoutFence.indexOf('{')
    const end = withoutFence.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('AI response did not contain JSON')
    return JSON.parse(withoutFence.slice(start, end + 1))
  }
}

export function parseNormalizedFeedback(raw: unknown, input: SanitizedFeedback): NormalizedFeedback {
  const value = typeof raw === 'string' ? extractJsonObject(raw) : raw
  const parsed = normalizedFeedbackSchema.safeParse(value)
  if (!parsed.success) throw new Error('AI response failed normalized feedback validation')
  if (parsed.data.route !== input.route && input.route !== 'Unknown — route not provided.') {
    throw new Error('AI response changed the user-provided route')
  }
  if (Object.keys(parsed.data.environment).some((key) => !(key in input.environment))) {
    throw new Error('AI response invented environment information')
  }
  return parsed.data
}

export const normalizedFeedbackInputSchema = z.object({ description: z.string().min(1) })
