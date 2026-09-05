# VEYRA Telegram Support Experience Design

## Goal

Redesign the VEYRA Telegram Support & Feedback Assistant so the normal user experience is a fast, callback-driven, mobile-first conversation rather than a command-oriented form. The bot should feel calm, premium, concise, multilingual, and safe while preserving the existing durable feedback pipeline.

## Scope and constraints

- Preserve Supabase feedback persistence, privacy sanitization, Zod validation, multi-provider AI routing, deterministic fallback, GitHub issue creation, `/aistatus`, `/reprocess`, admin identity checks, and existing tests.
- Do not expose provider names, engineering priority labels, internal identifiers, raw Telegram identity, or debugging details to normal users.
- Persist a report before optional AI enrichment. User acknowledgement must not wait on AI availability.
- Keep public controls in inline keyboards. Admin-only actions remain available only after server-side private-chat and admin validation.
- Keep normal bot messages to one to four short lines unless a summary or privacy explanation needs more space.

## User experience

### Entry points

`/start` renders a concise VEYRA Support menu with primary report types: bug, playback, streaming, search, feature idea, and general feedback. Secondary actions are My report and Help. `/bug`, `/feedback`, `/idea`, `/status`, and `/help` remain supported as power-user entry points.

Telegram deep links (`bug`, `playback`, `search`, `streaming`, `feedback`, and a short server-side context reference) enter the corresponding flow and skip questions already known from trusted context.

### Conversation state

Use explicit draft states: `IDLE`, `WAITING_DESCRIPTION`, `WAITING_AREA`, `WAITING_SEVERITY`, `WAITING_OPTIONAL_DETAIL`, `CONFIRMING`, `SUBMITTING`, and `COMPLETE`. Drafts are persisted through the existing service-role Supabase boundary so stateless webhook invocations do not lose progress. Each draft has a version/nonce used to reject stale callback payloads.

`/start` during a meaningful draft offers Start over and Keep current report. Empty drafts reset automatically. Cancel clears only the draft and reports that nothing was submitted. A persisted report is never described as cancelled.

### Flows

- Bug: accept text, image with caption, or supported short video; ask area, then user-facing impact; infer normalized fields; ask at most one targeted missing-detail question; show a compact confirmation before submit.
- Playback: ask symptom, optionally title, then device category. Trusted deep-link context pre-fills or skips known values.
- Streaming: dynamically render configured providers when practical, then accept a free-text description and optional attachment.
- Search: ask query, then issue type, with free-text fallback.
- Feature idea: accept one message, then offer optional context or immediate submission.
- General feedback: accept one message and submit without unnecessary follow-up.

All callback payloads are compact, versioned, non-sensitive, and validated against the current draft. Navigation edits the evolving bot menu message where safe, while user-created content and durable confirmations remain visible.

### Copy and localization

Centralize English, Arabic, and French copy. Detect the dominant language from the user’s text when confidence is sufficient and keep the response language consistent for the current draft. Product names, routes, ticket identifiers, and technical identifiers are not translated. Dynamic user content is escaped before Markdown/HTML formatting.

Functional emoji are limited to the VEYRA set: `🌙`, `🐛`, `▶️`, `📺`, `🔎`, `✨`, `💬`, `✅`, `⚠️`, `❌`, `📋`, and `🤖`/`♻️` for admin tools. Buttons are short, balanced, readable without color, and normally limited to two columns.

### Submission and status

After the repository accepts a report, acknowledge with a polished summary card and reference/ticket. AI and GitHub enrichment continue without exposing provider details. If a known issue match is available, associate the report without rejecting it. Status views map internal states to Received, Open, Investigating, Fixed, and Closed and hide internal metadata.

### Errors and media

Use specific user-facing recovery copy for save failures, attachment parsing failures, invalid input, rate limits, and temporary Telegram errors. Preserve the user’s text in the draft when retrying. AI failure is silent when deterministic processing succeeds. Unsupported media offers Continue without file and Try again.

## Admin experience

Render new reports as compact technical cards with ticket, safe priority/category, description, report count when available, normalized provider state, suspected investigation areas, and inline actions for opening the issue, viewing the prompt, reprocessing, duplicate marking, and resolving. Admin callbacks are validated server-side and never placed in public keyboards.

`/aistatus` renders a two-column-friendly list of configured providers with safe states: Healthy, Cooling down, Rate limited, Unavailable, or Not configured, plus deterministic fallback and an update timestamp. `/reprocess <ticket>` acknowledges once, then edits the same admin message with completion or a safe failure result.

## Architecture

Add focused Telegram modules that adapt to the current repository rather than replacing it:

- `lib/telegram/copy/` for locale dictionaries and language selection.
- `lib/telegram/keyboards/` for typed reusable inline keyboards and compact callback builders.
- `lib/telegram/state/` for draft types, transitions, persistence adapter, and stale-version checks.
- `lib/telegram/formatter.ts` for escaping, summaries, user status cards, and admin cards.
- `lib/telegram/flows/` for type-specific transitions and targeted follow-up decisions.
- `lib/telegram.ts` as the transport/orchestration facade, retaining existing exported compatibility helpers where tests or deployment code depend on them.

Extend the Telegram messenger abstraction with inline-keyboard messages, edits, callback answers, and optional typing/upload actions. Keep all external side effects dependency-injected for tests.

Refactor the feedback service into an acceptance phase and an enrichment phase, or an equivalent internal sequencing that sends the user acknowledgement immediately after durable creation while preserving the current AI/GitHub update semantics. Existing callers that expect `processFeedback` should continue to work.

## Testing and verification

Add/update tests for start layout, every report flow, media/captions, deep links, context skipping, back/cancel/restart, English/Arabic/French copy, dynamic provider buttons, escaping, stale callbacks, invalid callbacks, AI unavailability, persistence failure, duplicate association, status privacy, admin permissions, `/aistatus`, `/reprocess`, long messages, unsupported media, rate limiting, and successful submission.

Run the complete unit/integration suite, lint, typecheck, and production build. Review the diff for accidental infrastructure changes, secrets, formatting regressions, and undocumented manual Telegram setup. Manual QA should exercise a narrow mobile Telegram layout or equivalent update fixtures.

## Manual Telegram setup to document

Recommend BotFather display name `VEYRA Support`, short description `Support & feedback for VEYRA 🌙`, description `Report bugs, playback problems and ideas for VEYRA.`, and user-facing command descriptions for start, bug, feedback, idea, status, and help. Keep admin commands in a private admin scope where Telegram supports command scopes. Do not rename an existing public username automatically; suggest `@VeyraSupportBot` or `@VeyraFeedbackBot` only as options.
