# VEYRA Telegram Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, callback-driven, multilingual VEYRA Telegram support experience with durable drafts, idempotent updates, queued enrichment, polished user/admin messaging, and verified end-to-end flows.

**Architecture:** Keep the existing feedback domain, Supabase service-role repository, AI router, deterministic fallback, GitHub tracker, sanitization, and admin allowlist. Add separate Supabase-backed Telegram drafts, processed-update records, and enrichment jobs; Telegram webhook handling only performs fast state transitions and report acceptance, while a protected worker claims queued jobs with leases and performs AI/GitHub enrichment. Centralize copy, keyboards, callbacks, formatting, locale selection, and flow transitions behind focused modules while preserving compatibility exports from `lib/telegram.ts`.

**Tech Stack:** Next.js 16.3.3 route handlers, TypeScript 5.7, Zod 4, Supabase/Postgres, Telegram Bot API via `fetch`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-05-veyra-telegram-experience-design.md`

## Global Constraints

- Preserve Supabase feedback persistence, privacy sanitization, Zod validation, multi-provider AI routing, deterministic fallback, GitHub issue creation, `/aistatus`, `/reprocess`, admin identity checks, and existing tests.
- Do not expose provider names, engineering priority labels, internal identifiers, raw Telegram identity, or debugging details to normal users.
- Persist a report before optional AI enrichment. User acknowledgement must not wait on AI availability.
- Keep public controls in inline keyboards. Admin-only actions remain available only after server-side private-chat and admin validation.
- Keep normal bot messages to one to four short lines unless a summary or privacy explanation needs more space.
- Drafts are separate from `feedback_reports`; never use a report row as an incomplete conversation store.
- Every Telegram update and report submission is idempotent under duplicate webhook delivery.
- Locale detection is deterministic and sticky for the lifetime of a draft; it never changes because a later message is ambiguous.
- Media is bounded, metadata-only by default, and never sent to AI or persisted as raw binary.
- Every callback is versioned, compact, non-sensitive, validated against the current draft nonce/version, and rejected when stale.
- Enrichment is queued durably and claimed with a lease; no correctness depends on `after()` or post-response serverless execution.

---

### Task 1: Read the Next.js runtime guidance and map implementation seams

**Files:**
- Read: `node_modules/next/dist/docs/` relevant route-handler/runtime guidance
- Read: `AGENTS.md`, `lib/telegram.ts`, `app/api/telegram/webhook/route.ts`, `lib/feedback/service.ts`, `lib/feedback/supabase-repository.ts`, `supabase/migrations/20260905000000_feedback_reports.sql`
- Modify: none

**Interfaces:**
- Produces a verified runtime decision for the webhook and worker routes: both run in Node.js, use `Request`/`NextResponse`, and do not depend on post-response execution.

- [ ] **Step 1: Locate the installed Next.js route-handler and background-execution guidance**

Run:

```powershell
rg -n "route handler|runtime =|after\(|waitUntil|background" node_modules/next/dist/docs node_modules/next/dist/server -g '*.md' -g '*.ts'
```

- [ ] **Step 2: Confirm the current Telegram and feedback seams**

Run:

```powershell
rg -n "parseTelegramUpdate|handleTelegramUpdate|processFeedback|FeedbackRepository|TelegramMessenger|feedback_reports" lib app tests supabase
```

- [ ] **Step 3: Record the constraints in the plan implementation notes**

Use the findings to keep route code limited to parsing, idempotency, draft transitions, persistence, and queue insertion; do not introduce `after()` or an in-memory job queue.

- [ ] **Step 4: Commit the reviewed plan**

```powershell
git add docs/superpowers/plans/2026-09-05-veyra-telegram-experience.md
git commit -m "docs: plan modern VEYRA Telegram experience"
```

### Task 2: Add the Telegram domain types, centralized copy, callbacks, keyboards, and formatters

**Files:**
- Create: `lib/telegram/types.ts`
- Create: `lib/telegram/copy/en.ts`
- Create: `lib/telegram/copy/ar.ts`
- Create: `lib/telegram/copy/fr.ts`
- Create: `lib/telegram/copy/index.ts`
- Create: `lib/telegram/callbacks.ts`
- Create: `lib/telegram/keyboards.ts`
- Create: `lib/telegram/formatter.ts`
- Test: `tests/unit/telegram-copy.test.ts`
- Test: `tests/unit/telegram-formatters.test.ts`

**Interfaces:**
- Produces `TelegramLocale = 'en' | 'ar' | 'fr'`, `DraftState`, `DraftType`, `DraftContext`, `TelegramDraft`, `TelegramMediaRef`, `TelegramCallback`, `InlineKeyboardButton`, and `InlineKeyboardMarkup`.
- Produces `detectLocale(text: string): TelegramLocale | null`, `copyFor(locale)`, `encodeCallback(value): string`, `decodeCallback(data): TelegramCallback | null`, `buildStartKeyboard(locale)`, `buildAreaKeyboard(locale)`, `buildSeverityKeyboard(locale)`, `buildConfirmationKeyboard(locale)`, `buildHelpKeyboard(locale)`, `escapeTelegramText(value)`, `formatUserSummary(...)`, `formatSuccess(...)`, and `formatAdminReport(...)`.

- [ ] **Step 1: Write locale and keyboard contract tests**

```ts
it('renders the start keyboard with balanced public actions', () => {
  expect(buildStartKeyboard('en').inline_keyboard).toEqual([
    [{ text: '🐛 Report a bug', callback_data: 'v1:report:bug' }, { text: '▶️ Playback issue', callback_data: 'v1:report:playback' }],
    [{ text: '📺 Streaming issue', callback_data: 'v1:report:streaming' }, { text: '🔎 Search issue', callback_data: 'v1:report:search' }],
    [{ text: '✨ Suggest something', callback_data: 'v1:report:feature' }, { text: '💬 General feedback', callback_data: 'v1:report:feedback' }],
    [{ text: '📋 My report', callback_data: 'v1:status:menu' }, { text: '❓ Help', callback_data: 'v1:help' }],
  ])
})

it('detects Arabic and French deterministically and leaves ambiguous text unchanged', () => {
  expect(detectLocale('شنو المشكل اللي وقع؟')).toBe('ar')
  expect(detectLocale('La vidéo ne démarre pas')).toBe('fr')
  expect(detectLocale('hello')).toBe(null)
})
```

- [ ] **Step 2: Run the focused tests and verify the new contracts fail**

Run: `npm test -- tests/unit/telegram-copy.test.ts tests/unit/telegram-formatters.test.ts`

Expected: FAIL because the new modules and exports do not exist.

- [ ] **Step 3: Implement the typed copy, callbacks, keyboards, and safe formatting**

Use the approved copy in the spec. Callback data must use only values such as `v1:area:streaming`, `v1:severity:major`, `v1:submit`, `v1:cancel`, and `v1:back`; never embed chat IDs, user text, ticket strings, provider secrets, or media IDs. Escape dynamic content before applying the project’s chosen Telegram parse mode. Keep English as the fallback locale and expose neutral Modern Arabic/light Darija and natural French strings.

- [ ] **Step 4: Run the focused tests and verify the contracts pass**

Run: `npm test -- tests/unit/telegram-copy.test.ts tests/unit/telegram-formatters.test.ts`

Expected: PASS with exact button labels/layout, locale detection, callback round-trips, and malicious Markdown/HTML input safely escaped.

- [ ] **Step 5: Commit the Telegram presentation layer**

```powershell
git add lib/telegram tests/unit/telegram-copy.test.ts tests/unit/telegram-formatters.test.ts
git commit -m "feat: add VEYRA Telegram copy and keyboards"
```

### Task 3: Add durable drafts, update idempotency, media policy, and queued enrichment schema

**Files:**
- Modify: `lib/feedback/types.ts`
- Modify: `lib/feedback/service.ts`
- Modify: `lib/feedback/supabase-repository.ts`
- Create: `lib/telegram/repositories.ts`
- Create: `lib/feedback/enrichment-queue.ts`
- Create: `supabase/migrations/20260905000100_telegram_sessions_and_enrichment.sql`
- Test: `tests/unit/telegram-state.test.ts`
- Test: `tests/unit/enrichment-queue.test.ts`

**Interfaces:**
- Produces `TelegramDraftRepository` with `get(chatId)`, `upsert(draft)`, `clear(chatId, version)`, and `transition(chatId, expectedVersion, patch)`.
- Produces `TelegramUpdateRepository` with `claim(updateId, chatId)` and `complete(updateId, result)`.
- Produces `EnrichmentJobRepository` with `enqueue(input)`, `claimBatch(limit, now)`, `complete(jobId, patch)`, and `fail(jobId, error, nextAttemptAt)`.
- Produces `MediaPolicy`, `validateTelegramMedia(media)`, and `MAX_TELEGRAM_MEDIA_BYTES = 10_000_000` for photo/document and `20_000_000` for short video where Telegram metadata supports the size.

- [ ] **Step 1: Write failing tests for strict state transitions and durable queue behavior**

```ts
it('rejects a callback from an older draft version', () => {
  expect(() => transitionDraft(draft({ state: 'WAITING_AREA', version: 4 }), { type: 'area', value: 'streaming', version: 3 })).toThrow(/stale/i)
})

it('persists drafts separately from reports and advances exactly one state', () => {
  const next = transitionDraft(draft({ state: 'WAITING_AREA', version: 4 }), { type: 'area', value: 'streaming', version: 4 })
  expect(next.state).toBe('WAITING_SEVERITY')
  expect(next.version).toBe(5)
})

it('claims queued enrichment with a lease and does not claim it twice', async () => {
  const first = await queue.claimBatch(1, now)
  const second = await queue.claimBatch(1, now)
  expect(first).toHaveLength(1)
  expect(second).toHaveLength(0)
})
```

- [ ] **Step 2: Run focused tests and verify they fail before schema/repository implementation**

Run: `npm test -- tests/unit/telegram-state.test.ts tests/unit/enrichment-queue.test.ts`

Expected: FAIL with missing transition/queue modules or missing database adapter behavior.

- [ ] **Step 3: Add the migration and repository adapters**

Create `telegram_drafts` keyed by `chat_id`, storing only sanitized draft JSON, locale, state, version, nonce, trusted context, and timestamps. Create `telegram_updates` with unique `update_id`, status, chat ID, and completion metadata. Create `feedback_enrichment_jobs` with unique `(report_id, job_kind)`, `queued/processing/completed/failed` status, attempts, `available_at`, lease expiry, safe last-error category, and optional Telegram message target for admin completion edits. Add indexes for claim ordering and enable RLS with no public policies. Add report fields only for queue linkage if needed; do not add draft columns to `feedback_reports`.

`claimBatch` must atomically select due queued jobs or expired leases, mark them processing with a new lease, increment attempts, and return them. `enqueue` must be idempotent on `(report_id, job_kind)`. `claim(updateId, chatId)` must return false for an already completed/claimed update and true exactly once for new updates.

- [ ] **Step 4: Implement the strict state-transition table and media validation**

Allow only these transitions, each requiring the current version and nonce: `IDLE -> WAITING_DESCRIPTION`; `WAITING_DESCRIPTION -> WAITING_AREA|WAITING_OPTIONAL_DETAIL|CONFIRMING`; `WAITING_AREA -> WAITING_SEVERITY`; `WAITING_SEVERITY -> WAITING_OPTIONAL_DETAIL|CONFIRMING`; `WAITING_OPTIONAL_DETAIL -> CONFIRMING`; `CONFIRMING -> SUBMITTING|WAITING_OPTIONAL_DETAIL|IDLE`; `SUBMITTING -> COMPLETE|CONFIRMING`. Back transitions are explicit per screen and increment version. Reject all other transitions. Store Telegram file metadata/reference only after validating media type and size; do not download or persist binary media in this task.

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `npm test -- tests/unit/telegram-state.test.ts tests/unit/enrichment-queue.test.ts`

Expected: PASS with stale-version rejection, valid transition coverage, idempotent queue claims, bounded media policy, and separate draft/report persistence contracts.

- [ ] **Step 6: Commit durable state and queue infrastructure**

```powershell
git add lib/feedback/types.ts lib/feedback/service.ts lib/feedback/supabase-repository.ts lib/telegram/repositories.ts lib/feedback/enrichment-queue.ts supabase/migrations/20260905000100_telegram_sessions_and_enrichment.sql tests/unit/telegram-state.test.ts tests/unit/enrichment-queue.test.ts
git commit -m "feat: add durable Telegram drafts and enrichment queue"
```

### Task 4: Refactor feedback acceptance and enrichment for queue-first operation

**Files:**
- Modify: `lib/feedback/service.ts`
- Modify: `lib/feedback/supabase-repository.ts`
- Modify: `lib/feedback/github.ts` only if needed for status rendering compatibility
- Create: `lib/feedback/enrichment-worker.ts`
- Test: `tests/unit/feedback-service.test.ts`
- Test: `tests/unit/enrichment-worker.test.ts`

**Interfaces:**
- Produces `acceptFeedback(submission, dependencies): Promise<AcceptedFeedback>` that creates the report with deterministic normalized data, enqueues one enrichment job, and returns a user-safe acknowledgement payload without calling AI or GitHub.
- Produces `processEnrichmentJob(job, dependencies): Promise<EnrichmentOutcome>` that runs the existing router/GitHub workflow, updates the report, and marks the job complete or safely retryable.
- Keeps `processFeedback` as a compatibility wrapper for existing tests/callers; it must preserve persistence-before-AI ordering while delegating to the new phases.

- [ ] **Step 1: Add failing acceptance/worker sequencing tests**

```ts
it('acknowledges after durable create and enqueue, before AI', async () => {
  const events: string[] = []
  const accepted = await acceptFeedback(report, dependenciesWithEvents(events))
  expect(events).toEqual(['repository.create', 'enrichment.enqueue', 'messenger.send'])
  expect(accepted.ticket).toBe('VEYRA-20260905-TEST1234')
})

it('worker uses deterministic fallback when AI is unavailable and still creates the issue', async () => {
  const result = await processEnrichmentJob(job, unavailableRouterDependencies())
  expect(result.aiStatus).toBe('AI_UNAVAILABLE')
  expect(result.githubStatus).toBe('CREATED')
})
```

- [ ] **Step 2: Run focused tests and verify the new phases fail**

Run: `npm test -- tests/unit/feedback-service.test.ts tests/unit/enrichment-worker.test.ts`

Expected: FAIL because acceptance and worker functions do not yet exist.

- [ ] **Step 3: Implement report acceptance without synchronous AI/GitHub dependency**

Generate the existing ticket, insert the report using deterministic fallback and `AI_PENDING`/`PENDING` statuses, enqueue `job_kind = 'normalize-and-sync'`, then send a short user-safe summary with the reference. If the queue insert fails, retain the persisted report, mark it eligible for retry, and send only a safe save/try-again state appropriate to the transport; never delete the report. Use a stable idempotency key from Telegram update/report identity so duplicate submissions return the original ticket.

- [ ] **Step 4: Implement the leased worker with bounded retries and safe status updates**

Run the existing router, update normalized/AI fields, create or update the GitHub issue, update report status, and complete the job. Temporary failures use bounded exponential retry and a safe category; permanent validation/configuration failures complete with `AI_UNAVAILABLE`/`FAILED` state without leaking provider errors. If the report originated from an admin reprocess command, edit the stored admin message target once on completion.

- [ ] **Step 5: Run focused tests and verify they pass**

Run: `npm test -- tests/unit/feedback-service.test.ts tests/unit/enrichment-worker.test.ts`

Expected: PASS with acceptance-before-AI, AI outage tolerance, GitHub outage retention, idempotent submissions, retry/lease handling, and compatibility wrapper coverage.

- [ ] **Step 6: Commit queue-first feedback processing**

```powershell
git add lib/feedback/service.ts lib/feedback/supabase-repository.ts lib/feedback/enrichment-worker.ts lib/feedback/github.ts tests/unit/feedback-service.test.ts tests/unit/enrichment-worker.test.ts
git commit -m "feat: queue VEYRA feedback enrichment"
```

### Task 5: Implement Telegram transport, update parsing, and state-driven user flows

**Files:**
- Modify: `lib/telegram.ts`
- Modify: `app/api/telegram/webhook/route.ts`
- Create: `lib/telegram/transport.ts`
- Create: `lib/telegram/flows.ts`
- Create: `lib/telegram/context.ts`
- Test: `tests/unit/telegram.test.ts`
- Test: `tests/unit/telegram-flows.test.ts`

**Interfaces:**
- Produces `parseTelegramUpdate(update): TelegramEvent` for message, callback query, command, media, deep-link, and ignore events while preserving existing legacy parse behavior where tests require it.
- Produces `handleTelegramUpdate(event, dependencies): Promise<void>` with update claim/idempotency, draft load, validated transition, and transport calls.
- Produces `createTelegramClient(env, fetchImpl)` with `sendMessage`, `editMessage`, `answerCallbackQuery`, `sendChatAction`, and inline keyboard support.

- [ ] **Step 1: Write failing tests for the complete public flow matrix**

Cover exact behavior for `/start`, bug, playback, streaming, search, idea, feedback, help/privacy, back, cancel, restart, deep links, context skipping, image+caption, supported media, unsupported media, long text trimming, duplicate updates, stale callbacks, callback validation, English, Arabic, and French. Include these concrete assertions:

```ts
it('starts a bug draft with concise inline controls', async () => {
  await handleTelegramUpdate(startEvent, deps)
  expect(messenger.last).toMatchObject({ text: '🌙 VEYRA Support\n\nFound a problem or have an idea?', reply_markup: expect.any(Object) })
})

it('skips known area context from a deep link', async () => {
  await handleTelegramUpdate(deepLinkPlaybackEvent, deps)
  expect(messenger.last.text).toContain("What's happening?")
  expect(messenger.last.text).not.toContain('Where did it happen?')
})

it('does not accept a stale callback for a newer draft', async () => {
  await handleTelegramUpdate(staleCallbackEvent, deps)
  expect(messenger.last.text).toContain('This menu is out of date')
  expect(repo.transition).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run focused Telegram tests and verify they fail**

Run: `npm test -- tests/unit/telegram.test.ts tests/unit/telegram-flows.test.ts`

Expected: FAIL with missing callback/media/state behavior and old command-only copy assertions.

- [ ] **Step 3: Implement safe Telegram update parsing and idempotent webhook handling**

Parse `update_id`, `message`, `callback_query`, private/group chat type, command arguments, `start` payload, text, caption, photo/document/video metadata, and Telegram message IDs. Claim the update before side effects; duplicates answer callbacks if necessary but do not mutate drafts, submit reports, or send duplicate confirmations. Verify admin identity server-side for every admin command and callback.

- [ ] **Step 4: Implement transport methods and compact inline keyboards**

Use `parse_mode: 'HTML'` or the project’s selected safe mode consistently, escape all dynamic content, include `reply_markup` only where needed, and use `editMessageText` for evolving menus. Answer callback queries quickly. Send `typing` or `upload_photo`/`upload_video` only when the operation can be noticeable; never send fake AI/loading text.

- [ ] **Step 5: Implement user flows with the explicit transition table**

Use the current draft’s sticky locale, context, version, and nonce. Accept description text or caption; acknowledge grounded excerpts without inventing facts; ask only area/severity or one targeted missing detail; map impact labels internally to P0/P1/P2/P3; render confirmation; submit via `acceptFeedback`; clear/complete the draft only after idempotent acceptance. Implement playback symptom/title/device, streaming provider/description, search query/issue type, feature optional context, and feedback one-message flows. Keep product names/routes untranslated.

- [ ] **Step 6: Implement cancel, back, restart, and user-safe error states**

Use `Report cancelled. Nothing was submitted.` only for draft cancellation. On save failure preserve the draft and offer Try again/Cancel. For media failure offer Continue without file/Try again. For rate limits use the concise retry-later copy. For invalid text ask for one sentence. Never expose AI failures when deterministic acceptance succeeds.

- [ ] **Step 7: Run focused Telegram tests and verify they pass**

Run: `npm test -- tests/unit/telegram.test.ts tests/unit/telegram-flows.test.ts`

Expected: PASS for all public flow, idempotency, callback, locale, media, escaping, and error-state cases.

- [ ] **Step 8: Commit Telegram flow implementation**

```powershell
git add lib/telegram.ts app/api/telegram/webhook/route.ts lib/telegram/transport.ts lib/telegram/flows.ts lib/telegram/context.ts tests/unit/telegram.test.ts tests/unit/telegram-flows.test.ts
git commit -m "feat: modernize VEYRA Telegram conversations"
```

### Task 6: Add durable enrichment worker route and modern admin/status experience

**Files:**
- Create: `app/api/telegram/enrichment/route.ts`
- Modify: `lib/telegram.ts`
- Modify: `lib/telegram/formatter.ts`
- Modify: `lib/feedback/enrichment-worker.ts`
- Modify: `tests/unit/telegram.test.ts`
- Create: `tests/unit/telegram-enrichment-route.test.ts`
- Modify: `README.md`
- Modify: `.env.example` if present, otherwise create it

**Interfaces:**
- Produces `POST /api/telegram/enrichment`, protected by `TELEGRAM_ENRICHMENT_SECRET`, that claims a bounded batch and processes jobs with leases; it returns counts only and never exposes job/provider secrets.
- Produces `formatAIStatus(statuses, now?)` with safe states and deterministic fallback.
- Produces admin-only `/aistatus` and `/reprocess <ticket>` handlers with single-message acknowledgement/edit semantics.

- [ ] **Step 1: Write failing worker-route and admin tests**

```ts
it('rejects enrichment requests without the worker secret', async () => {
  const response = await POST(new Request('http://localhost/api/telegram/enrichment'))
  expect(response.status).toBe(401)
})

it('renders admin AI status without model names or secrets', () => {
  const text = formatAIStatus(statuses)
  expect(text).toContain('🤖 AI Router')
  expect(text).toContain('Healthy')
  expect(text).not.toContain('secret-model')
})
```

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm test -- tests/unit/telegram-enrichment-route.test.ts tests/unit/telegram.test.ts`

Expected: FAIL because the worker route and modern admin formatting are not implemented.

- [ ] **Step 3: Implement the protected queue worker route**

Require `TELEGRAM_ENRICHMENT_SECRET` when configured and reject mismatches with 401. Claim at most the configured batch size, process each lease, and return `{ ok: true, claimed, completed, retried }`. The route must be safe to invoke repeatedly from an external cron/scheduler and must not rely on response-lifecycle hooks.

- [ ] **Step 4: Implement admin cards, `/aistatus`, `/reprocess`, duplicate, resolve, and status views**

Render admin reports with ticket/category/priority, safe normalized summary, suspected areas, and inline actions. `/aistatus` maps internal health to Healthy/Cooling down/Rate limited/Unavailable/Not configured and includes `Local deterministic — Always available`. `/reprocess` validates the ticket, enqueues a reprocess job idempotently, stores its admin edit target, and edits the same message after worker completion. User status hides GitHub usernames, raw URLs unless intentionally public, Telegram IDs, AI providers, prompts, and internal labels.

- [ ] **Step 5: Document environment variables, scheduler setup, media rules, and BotFather settings**

Document `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_ENRICHMENT_SECRET`, `TELEGRAM_ADMIN_CHAT_IDS`, Supabase service-role settings, GitHub settings, AI settings, queue batch/lease/retry settings, and the external scheduler contract. State media limits: accept metadata for photo/document up to 10 MB and short video up to 20 MB when Telegram metadata includes size; do not persist binary or send it to AI; allow text-only continuation when unsupported. Include BotFather name, descriptions, command scopes, webhook registration, and the manual scheduler setup.

- [ ] **Step 6: Run focused tests and verify they pass**

Run: `npm test -- tests/unit/telegram-enrichment-route.test.ts tests/unit/telegram.test.ts`

Expected: PASS with worker authentication, batch processing, admin restrictions, safe AI status, reprocess queueing, edit targets, and status privacy.

- [ ] **Step 7: Commit admin and worker integration**

```powershell
git add app/api/telegram/enrichment/route.ts lib/telegram.ts lib/telegram/formatter.ts lib/feedback/enrichment-worker.ts tests/unit/telegram.test.ts tests/unit/telegram-enrichment-route.test.ts README.md .env.example
git commit -m "feat: add durable VEYRA Telegram enrichment worker"
```

### Task 7: Add end-to-end fixtures and run the full verification gate

**Files:**
- Modify: `tests/unit/telegram.test.ts`
- Modify: `tests/unit/telegram-flows.test.ts`
- Create or modify: `tests/integration/telegram-webhook.test.ts`
- Modify: `playwright.config.ts` only if a local Telegram fixture route is required
- Modify: `docs/superpowers/plans/2026-09-05-veyra-telegram-experience.md` to mark completed steps

**Interfaces:**
- Produces repeatable fixture-driven coverage for webhook delivery, duplicate updates, callback navigation, durable draft/report separation, queued enrichment, and admin authorization without real Telegram/Supabase/GitHub/AI credentials.

- [ ] **Step 1: Add a fixture matrix for the major paths**

Cover start → bug → description → area → severity → submit, playback, streaming provider, search, feature, feedback, back/cancel/restart, deep-link context, Arabic, French, image caption, unsupported media, stale callback, duplicate update, backend failure, rate limit, AI unavailable, duplicate issue, status, admin report, `/aistatus`, and `/reprocess`.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: exit code 0 with zero failures.

- [ ] **Step 3: Run typecheck and lint**

Run:

```powershell
npm run typecheck
npm run lint
```

Expected: both commands exit 0 with no diagnostics introduced by this work.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: exit code 0 and both Telegram routes included in the Next.js build.

- [ ] **Step 5: Review diff, requirements, and runtime behavior**

Run:

```powershell
git status --short
git diff --check
git diff --stat
```

Confirm there are no secrets, no raw media writes, no public admin buttons, no report rows used as drafts, no post-response execution dependency, no stale-callback mutation path, and no unbounded message/media behavior. Manually inspect narrow-screen message text and button labels using update fixtures or Telegram test chat.

- [ ] **Step 6: Commit final tests and documentation**

```powershell
git add tests docs/superpowers/plans/2026-09-05-veyra-telegram-experience.md
git commit -m "test: verify VEYRA Telegram experience"
```

## Coverage audit

- UX/menu/copy/keyboards: Task 2 and Task 5.
- Durable draft/report separation: Task 3.
- Idempotent updates/submissions: Tasks 3–5.
- Sticky deterministic locales: Tasks 2 and 5.
- Explicit media limits/storage: Tasks 3 and 6.
- Strict transitions/version/nonce: Task 3 and Task 5.
- Queue-first enrichment and serverless safety: Tasks 3, 4, and 6.
- AI/GitHub preservation and outage behavior: Task 4.
- Admin/security/status/reprocess: Task 6.
- Tests, lint, typecheck, build, manual QA: Task 7.
