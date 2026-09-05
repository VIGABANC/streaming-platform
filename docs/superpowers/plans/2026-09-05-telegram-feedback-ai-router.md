# VEYRA Telegram Feedback AI Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a durable Telegram feedback pipeline that accepts and stores every valid report before AI, enriches it through configurable free-first providers with bounded failover, creates safe GitHub tickets, acknowledges users, and supports admin reprocessing/status commands.

**Architecture:** Keep the AI layer pure and provider-agnostic: sanitized feedback enters a Zod-validated router, configured providers are selected by priority, and a deterministic fallback is always available. Keep the workflow side-effect ordering explicit: durable repository insert, bounded AI enrichment, repository update, GitHub issue create/update, then Telegram acknowledgement. Use dependency injection for repository, provider, issue-tracker, messenger, clock, and logger so all outage scenarios are testable without vendor credentials.

**Tech Stack:** Next.js 16 route handlers, TypeScript, Zod, native `fetch`, Supabase/Postgres, Vitest.

**Spec:** `C:\Users\ossam\.codex\attachments\7e7599cd-3f7b-4abc-a4c8-37069251c75d\pasted-text.txt`

## Global Constraints

- AI must enhance the feedback system, but AI must never be required for accepting a report.
- Every valid Telegram report must be safely persisted before any AI request begins.
- Default production failover order is Groq, Google Gemini, Cloudflare Workers AI, Mistral, OpenRouter Free, Cohere, Hugging Face, deterministic fallback; Cerebras and NVIDIA NIM are optional.
- Missing provider keys disable providers cleanly rather than crashing the application.
- Recoverable provider failures include 408, 429, 500, 502, 503, 504, timeout, malformed output, and temporary model unavailability; 401/403 disables a provider.
- After 3 consecutive temporary failures, a provider enters cooldown and receives one probe after cooldown expiry.
- Per-provider timeout is 8–15 seconds and maximum synchronous AI budget is approximately 20–30 seconds.
- AI must not receive Telegram username, name, user ID, admin chat ID, IP address, screenshots, or unnecessary metadata.
- `AI_ZERO_COST_ONLY=true` must prevent known billable model usage and preserve deterministic operation at $0 AI spend.
- Do not use GitHub Models inference.
- Never write API keys, raw provider errors containing secrets, or sensitive Telegram data to GitHub.

---

### Task 1: Feedback domain, privacy normalization, and deterministic fallback

**Files:**
- Create: `lib/feedback/types.ts`
- Create: `lib/feedback/normalize.ts`
- Create: `tests/unit/feedback-normalize.test.ts`

**Interfaces:**
- Produces `RawFeedback`, `SanitizedFeedback`, `NormalizedFeedback`, `FeedbackType`, `FeedbackSeverity`, and Zod `normalizedFeedbackSchema`.
- Produces `sanitizeFeedback(input: RawFeedback): SanitizedFeedback`, `parseNormalizedFeedback(raw: unknown, input: SanitizedFeedback): NormalizedFeedback`, and `deterministicFallback(input: SanitizedFeedback): NormalizedFeedback`.

- [ ] **Step 1: Write failing privacy and fallback tests**

```ts
it('strips Telegram identity and obvious secrets before provider use', () => {
  const safe = sanitizeFeedback({
    description: 'Bearer abc123; password=hunter2; playback fails',
    type: 'bug', category: 'playback', severity: 'P1', route: '/watch/movie/42',
    telegramUserId: '987', telegramUsername: 'secret-user',
    environment: { browser: 'Firefox' },
  })
  expect(safe).not.toHaveProperty('telegramUserId')
  expect(safe).not.toHaveProperty('telegramUsername')
  expect(safe.description).not.toContain('abc123')
  expect(safe.description).not.toContain('hunter2')
})

it('creates a usable deterministic engineering ticket without AI', () => {
  const result = deterministicFallback({
    description: 'The stream stays loading on the episode page.',
    type: 'playback', category: 'streaming', severity: 'P1',
    route: '/watch/tv/42/1/2', expectedBehavior: 'Video starts',
    actualBehavior: 'Spinner never ends', environment: {},
  })
  expect(result.title).toBe('Playback — Streaming — user-reported loading problem')
  expect(result.developer_prompt).toContain('The user\'s description is evidence')
  expect(result.confidence).toBe(0)
})

it('rejects model output that invents missing facts or violates schema', () => {
  expect(() => parseNormalizedFeedback({ type: 'bug', title: 'Invented route /admin' }, input)).toThrow()
})
```

- [ ] **Step 2: Run the focused tests and verify they fail because the domain module is missing**

Run: `npm test -- tests/unit/feedback-normalize.test.ts`

Expected: FAIL with module/export errors for `lib/feedback/normalize`.

- [ ] **Step 3: Implement the Zod schema, secret redaction, JSON extraction, and deterministic fallback**

Implement `NormalizedFeedback` with required fields from the spec, bounded strings/arrays, `confidence` in `[0, 1]`, and explicit unknown-safe defaults. Redact bearer/API/cookie/password/token/authorization patterns, omit Telegram-only fields, trim field sizes, and make fallback fields derive only from sanitized input.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- tests/unit/feedback-normalize.test.ts`

Expected: PASS with all privacy, schema, and fallback tests green.

### Task 2: Provider configuration and normalized provider adapters

**Files:**
- Create: `lib/ai/types.ts`
- Create: `lib/ai/config.ts`
- Create: `lib/ai/provider-utils.ts`
- Create: `lib/ai/providers/groq.ts`
- Create: `lib/ai/providers/gemini.ts`
- Create: `lib/ai/providers/cloudflare.ts`
- Create: `lib/ai/providers/mistral.ts`
- Create: `lib/ai/providers/openrouter.ts`
- Create: `lib/ai/providers/cohere.ts`
- Create: `lib/ai/providers/huggingface.ts`
- Create: `lib/ai/providers/cerebras.ts`
- Create: `lib/ai/providers/nvidia.ts`
- Create: `lib/ai/providers/deterministic.ts`
- Create: `tests/unit/ai-config.test.ts`

**Interfaces:**
- Produces `AIProvider`, `AIProviderError`, `AIProviderId`, `ProviderConfig`, and `AIProviderStatus`.
- Produces `getAIConfig(env)`, `createConfiguredProviders(config, fetchImpl)`, and one `AIProvider` implementation per provider file.

- [ ] **Step 1: Write failing configuration and adapter contract tests**

```ts
it('only configures providers with credentials and uses the required free-first order', () => {
  const config = getAIConfig({ GROQ_API_KEY: 'g', GEMINI_API_KEY: 'ga', ALLOW_PAID_AI: 'false', AI_ZERO_COST_ONLY: 'true' })
  expect(config.providerOrder.slice(0, 5)).toEqual(['groq', 'gemini', 'cloudflare', 'mistral', 'openrouter'])
  expect(createConfiguredProviders(config, fetch).map((provider) => provider.id)).toEqual(['groq', 'gemini'])
})

it('rejects a non-free OpenRouter model when zero-cost mode is enabled', () => {
  expect(() => getAIConfig({ OPENROUTER_API_KEY: 'or', OPENROUTER_MODEL: 'paid/model', AI_ZERO_COST_ONLY: 'true' })).toThrow(/free/i)
})

it('maps provider status codes to safe retry/auth failures', async () => {
  const provider = createGroqProvider({ apiKey: 'key', model: 'model', fetchImpl: async () => new Response('rate limited', { status: 429, headers: { 'Retry-After': '4' } }) })
  await expect(provider.normalize(input, { signal: new AbortController().signal })).rejects.toMatchObject({ kind: 'rate_limit', retryAfterMs: 4000 })
})
```

- [ ] **Step 2: Run the focused tests and verify they fail because provider contracts are missing**

Run: `npm test -- tests/unit/ai-config.test.ts`

Expected: FAIL with missing module/export errors.

- [ ] **Step 3: Implement central config, safe model guards, fetch timeout/error mapping, and provider adapters**

Use the exact supported environment variables from the spec. Centralize defaults, keep provider order configurable via `AI_PROVIDER_ORDER`, allow `GEMINI_MODEL`, `CLOUDFLARE_AI_MODEL`, `MISTRAL_MODEL`, and `OPENROUTER_MODEL`, and use compact JSON prompts. Parse each vendor response into the shared `parseNormalizedFeedback` path. Never include raw response bodies in thrown errors or logs.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- tests/unit/ai-config.test.ts`

Expected: PASS with provider ordering, free-safety, timeout, auth, and 429 mapping covered.

### Task 3: Router, circuit breaker, bounded budget, status, and metrics

**Files:**
- Create: `lib/ai/router.ts`
- Create: `tests/unit/ai-router.test.ts`

**Interfaces:**
- Produces `createAIRouter(options): AIRouter`, where `normalize(input)` returns `{ success: true, provider, model, fallbackDepth, latencyMs, aiProcessed, feedback }`.
- Produces `getStatus()` with no secrets and aggregate counters for reports/providers.

- [ ] **Step 1: Write failing router tests for failover and fallback**

```ts
it('fails over from Groq 429 to Gemini and stops after the first success', async () => {
  const router = createAIRouter({ providers: [failing('groq', 'rate_limit'), succeeding('gemini')], config: testConfig() })
  const result = await router.normalize(input)
  expect(result).toMatchObject({ success: true, provider: 'gemini', fallbackDepth: 1, aiProcessed: true })
})

it('uses deterministic fallback when all providers fail without throwing', async () => {
  const router = createAIRouter({ providers: [failing('groq', 'temporary'), failing('gemini', 'timeout')], config: testConfig() })
  const result = await router.normalize(input)
  expect(result).toMatchObject({ success: true, provider: 'deterministic', aiProcessed: false })
  expect(result.feedback.developer_prompt).toContain('reproduce the issue')
})

it('opens cooldown after three temporary failures and probes only after cooldown', async () => {
  const clock = fakeClock()
  const provider = failing('groq', 'temporary')
  const router = createAIRouter({ providers: [provider], config: { ...testConfig(), cooldownMs: 1000 }, clock })
  await router.normalize(input); await router.normalize(input); await router.normalize(input)
  expect(router.getStatus().find((s) => s.provider === 'groq')?.health).toBe('cooldown')
  await router.normalize(input)
  expect(provider.calls).toBe(3)
  clock.advance(1000)
  await router.normalize(input)
  expect(provider.calls).toBe(4)
})
```

- [ ] **Step 2: Run the focused tests and verify they fail because the router is missing**

Run: `npm test -- tests/unit/ai-router.test.ts`

Expected: FAIL with missing router exports.

- [ ] **Step 3: Implement one-call provider selection, circuit state, safe failure classification, and budget enforcement**

Track enabled/disabled, health, consecutive failures, last success/failure, 429/timeout state, cooldown, and average latency. Skip cooldown providers, disable 401/403 providers, honor Retry-After as cooldown floor, and stop launching providers when the synchronous budget expires. Return deterministic fallback metadata instead of throwing.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- tests/unit/ai-router.test.ts`

Expected: PASS with failover, malformed output, timeout, cooldown, probe, budget, status, and metrics tests green.

### Task 4: Durable feedback workflow and safe GitHub issue rendering

**Files:**
- Create: `lib/feedback/service.ts`
- Create: `lib/feedback/github.ts`
- Create: `lib/feedback/metrics.ts`
- Create: `tests/unit/feedback-service.test.ts`
- Create: `tests/unit/github-renderer.test.ts`

**Interfaces:**
- Produces `FeedbackRepository`, `IssueTracker`, `TelegramMessenger`, `processFeedback(input, dependencies)`, and `reprocessFeedback(record, dependencies)`.
- Produces safe `renderGitHubIssue(record, aiResult)` and GitHub `createGitHubIssueTracker(env, fetchImpl)`.

- [ ] **Step 1: Write failing workflow tests proving persistence precedes AI**

```ts
it('persists before AI, creates a deterministic ticket when AI is unavailable, and acknowledges the user', async () => {
  const events: string[] = []
  const result = await processFeedback(report, {
    repository: recordingRepo(events), router: unavailableRouter(),
    issueTracker: recordingIssues(events), messenger: recordingMessenger(events),
  })
  expect(events[0]).toBe('repository.create')
  expect(events).toEqual(['repository.create', 'router.normalize', 'repository.update', 'issues.create', 'messenger.send'])
  expect(result.accepted).toBe(true)
  expect(result.aiStatus).toBe('AI_UNAVAILABLE')
  expect(result.feedback.developer_prompt).toContain('Required workflow')
})

it('keeps the persisted report when GitHub is unavailable', async () => {
  const repo = recordingRepo([])
  const result = await processFeedback(report, { repository: repo, router: successfulRouter(), issueTracker: unavailableIssues(), messenger: recordingMessenger([]) })
  expect(result.accepted).toBe(true)
  expect(result.githubStatus).toBe('PENDING')
  expect(repo.records[0].ticket).toBe(result.ticket)
})
```

- [ ] **Step 2: Run the focused tests and verify they fail because the workflow is missing**

Run: `npm test -- tests/unit/feedback-service.test.ts tests/unit/github-renderer.test.ts`

Expected: FAIL with missing module/export errors.

- [ ] **Step 3: Implement the workflow and issue adapter**

Insert a report with `AI_PENDING` and deterministic data before calling the router. Update it with AI metadata or deterministic status, create a GitHub issue using only safe facts/inferences/unknowns/verification, preserve the record on GitHub failure, and acknowledge only after acceptance. Keep issue/repository error messages sanitized. Reprocessing must reuse the stored sanitized input and update an existing issue when present.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `npm test -- tests/unit/feedback-service.test.ts tests/unit/github-renderer.test.ts`

Expected: PASS with ordering, all-provider outage, GitHub outage, invented-information, and reprocessing tests green.

### Task 5: Supabase persistence, Telegram webhook, admin commands, and deployment documentation

**Files:**
- Create: `lib/supabase/admin.ts`
- Create: `lib/feedback/supabase-repository.ts`
- Create: `lib/telegram.ts`
- Create: `app/api/telegram/webhook/route.ts`
- Create: `supabase/migrations/20260905000000_feedback_reports.sql`
- Create: `.env.example`
- Modify: `README.md`
- Create: `tests/unit/telegram.test.ts`

**Interfaces:**
- Produces `parseTelegramUpdate`, `formatAIStatus`, `isAdminChat`, and `handleTelegramUpdate`.
- Webhook exposes `POST /api/telegram/webhook`, validates `TELEGRAM_WEBHOOK_SECRET` when configured, and returns 200 after valid updates are accepted for processing.

- [ ] **Step 1: Write failing Telegram command and persistence tests**

```ts
it('accepts a report through the webhook shape without sending identity to the workflow', () => {
  const report = parseTelegramUpdate({ message: { message_id: 4, chat: { id: 22 }, from: { id: 99, username: 'hidden' }, text: '/bug Player keeps loading at /watch/movie/42' } })
  expect(report).toMatchObject({ kind: 'report', chatId: '22', feedback: { type: 'bug', route: '/watch/movie/42' } })
  expect(report.feedback).not.toHaveProperty('telegramUserId')
})

it('restricts /aistatus and /reprocess to configured private admin chats', async () => {
  expect(isAdminChat('42', { TELEGRAM_ADMIN_CHAT_IDS: '42' })).toBe(true)
  expect(isAdminChat('43', { TELEGRAM_ADMIN_CHAT_IDS: '42' })).toBe(false)
  expect(formatAIStatus([{ provider: 'groq', health: 'healthy', enabled: true }])).toContain('Groq')
})
```

- [ ] **Step 2: Run the focused tests and verify they fail because Telegram/persistence modules are missing**

Run: `npm test -- tests/unit/telegram.test.ts`

Expected: FAIL with missing module/export errors.

- [ ] **Step 3: Implement service-role Supabase repository, SQL table/RLS, Telegram parser, webhook, and admin commands**

Store sanitized feedback, deterministic seed, normalized result, AI provider/model/status, fallback depth, GitHub status/number/url, and timestamps. Enable RLS with no public write policy; webhook uses `SUPABASE_SERVICE_ROLE_KEY`. Support `/bug`, `/complaint`, `/feature`, `/playback`, `/ux`, `/aistatus`, and `/reprocess <ticket>`. Keep acknowledgements concise and disclose AI-unavailable state without exposing provider secrets.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npm test -- tests/unit/telegram.test.ts`

Expected: PASS with command parsing, admin restrictions, webhook secret, and acknowledgement tests green.

- [ ] **Step 5: Document every environment variable and operating rule**

Add all provider keys/models, router controls, Telegram bot/admin settings, GitHub settings, and Supabase service-role settings to `.env.example`; document migration, webhook registration, `/aistatus`, `/reprocess`, zero-cost mode, and the fact that 24/7 applies to acceptance and durable storage rather than guaranteed AI availability.

### Task 6: Full verification and requirement audit

**Files:**
- Modify: `docs/superpowers/plans/2026-09-05-telegram-feedback-ai-router.md` (check completed steps only)

- [ ] **Step 1: Run the complete unit/integration suite**

Run: `npm test`

Expected: all existing and new tests pass with zero failures.

- [ ] **Step 2: Run typecheck and lint**

Run: `npm run typecheck; npm run lint`

Expected: both commands exit 0 with no new diagnostics.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js 16 production build exits 0 and includes `app/api/telegram/webhook`.

- [ ] **Step 4: Re-read the specification and audit explicit failure cases**

Verify tests or code paths cover Groq unavailable/429, multiple provider outage, OpenRouter quota exhaustion, invalid credentials, malformed JSON, timeout, all-provider outage with multiple reports, GitHub outage, invented information/schema violation, persistence-before-AI ordering, status privacy, and reprocessing eligibility. Report any unimplemented external setup separately from code completion.

- [ ] **Step 5: Review the final diff and prepare handoff**

Run: `git status --short; git diff --stat; git diff --check`

Expected: only scoped feedback/AI/workflow/docs/test changes plus the plan are present, with no secrets or generated artifacts.
