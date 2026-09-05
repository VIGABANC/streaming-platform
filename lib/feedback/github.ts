import type { FeedbackRecord } from './types'

export interface GitHubIssueDraft {
  title: string
  body: string
  labels: string[]
}

function list(values: string[]): string {
  return values.length ? values.map((value) => `- ${value}`).join('\n') : '- None provided; verify during investigation.'
}

function safeIssueText(value: string): string {
  return value
    .replace(/(bearer\s+)[^\s,;]+/gi, '$1[secret removed]')
    .replace(/((?:api[_-]?key|token|secret|password|authorization|cookie)\s*[:=]\s*)[^\s,;]+/gi, '$1[secret removed]')
    .replace(/\[REDACTED\]/gi, '[secret removed]')
    .slice(0, 8_000)
}

export function renderGitHubIssue(record: FeedbackRecord): GitHubIssueDraft {
  const feedback = record.normalized
  const input = record.input
  return {
    title: `[${feedback.severity}] ${safeIssueText(feedback.title)}`.slice(0, 180),
    labels: ['feedback', feedback.type, feedback.severity.toLowerCase()],
    body: [
      `## VEYRA feedback — ${record.ticket}`,
      '',
      '### User-reported facts',
      `- Type: ${input.type}`,
      `- Category: ${safeIssueText(input.category)}`,
      `- Severity: ${input.severity}`,
      `- Route: ${safeIssueText(input.route)}`,
      `- Description: ${safeIssueText(input.description)}`,
      `- Expected behavior: ${safeIssueText(input.expectedBehavior)}`,
      `- Actual behavior: ${safeIssueText(input.actualBehavior)}`,
      `- Environment: ${safeIssueText(JSON.stringify(input.environment))}`,
      '',
      '### AI inferences',
      `- Summary: ${safeIssueText(feedback.summary)}`,
      `- Suspected areas:\n${list(feedback.suspected_areas)}`,
      '',
      '### Unknown information',
      list(feedback.missing_information),
      '',
      '### Required verification',
      list(feedback.acceptance_criteria),
      '',
      '### Fix plan',
      list(feedback.fix_plan),
      '',
      '### Developer prompt',
      '```text',
      safeIssueText(feedback.developer_prompt),
      '```',
      '',
      '### AI processing',
      `- Provider: ${record.aiProvider ?? 'deterministic fallback'}`,
      `- Model: ${record.aiModel ?? 'none'}`,
      `- Status: ${record.aiStatus === 'SUCCESS' ? 'Success' : 'AI unavailable'}`,
      `- Fallback depth: ${record.fallbackDepth}`,
      `- Reprocessing eligible: ${record.aiStatus === 'AI_UNAVAILABLE' ? 'Yes' : 'No'}`,
    ].join('\n'),
  }
}

export function createGitHubIssueTracker(env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch) {
  const token = env.GITHUB_TOKEN
  const repository = env.GITHUB_REPOSITORY
  if (!token || !repository || !/^[^/]+\/[^/]+$/.test(repository)) {
    throw new Error('GitHub issue integration is not configured')
  }
  const endpoint = `https://api.github.com/repos/${repository}/issues`
  const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' }
  return {
    async createIssue(record: FeedbackRecord) {
      const draft = renderGitHubIssue(record)
      const response = await fetchImpl(endpoint, { method: 'POST', headers, body: JSON.stringify(draft) })
      if (!response.ok) throw new Error(`GitHub issue creation failed (${response.status})`)
      const value = await response.json() as { number?: number; html_url?: string }
      if (!value.number || !value.html_url) throw new Error('GitHub returned an invalid issue')
      return { number: value.number, url: value.html_url }
    },
    async updateIssue(number: number, record: FeedbackRecord) {
      const draft = renderGitHubIssue(record)
      const response = await fetchImpl(`${endpoint}/${number}`, { method: 'PATCH', headers, body: JSON.stringify(draft) })
      if (!response.ok) throw new Error(`GitHub issue update failed (${response.status})`)
      return { number, url: `https://github.com/${repository}/issues/${number}` }
    },
  }
}
