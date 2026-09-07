# Implementation Plan: VEYRA Two-Bot Telegram Experience

**Branch:** `codex/veyra-telegram-bots`  
**Spec:** `docs/superpowers/specs/2026-09-05-veyra-two-bot-architecture-design.md`  
**Date:** 2026-09-05

## Implementation rules

- Preserve existing slash-command compatibility.
- Write tests before each behavior change.
- Keep secrets server-only and use separate bot token/secret fallbacks.
- Store reports before AI, GitHub, or notification side effects.
- Verify each step with focused tests, then run the full suite and production build.

## Step 1: shared Telegram protocol

Files: `lib/telegram.ts`, `app/api/telegram/webhook/route.ts`, `tests/unit/telegram.test.ts`.

1. Add typed Telegram update, callback-query, user, chat, and attachment parsing.
2. Add inline-keyboard and deep-link builders with compact callback ids.
3. Expand the messenger abstraction to support keyboards, callback answers, editing messages, and optional user notifications while keeping `sendMessage` compatible.
4. Add bot-specific token and webhook-secret resolution with legacy Feedback fallbacks.
5. Test valid commands, malformed updates, callback parsing, deep-link payloads, and secret isolation.

## Step 2: wizard session persistence

Files: `supabase/migrations/20260905000200_telegram_feedback_sessions.sql`, `lib/feedback/sessions.ts`, `tests/unit/feedback-sessions.test.ts`.

1. Add an expiring session table keyed by bot/chat/user.
2. Define `selectType`, `description`, `context`, `attachment`, `review`, and `idle` steps.
3. Add repository operations to create, update, read, and clear sessions.
4. Enforce size limits and sanitize draft text before persistence.
5. Test expiry, replacement, cancellation, and concurrent/replayed updates.

## Step 3: Feedback Bot wizard

Files: `lib/telegram-feedback.ts`, `lib/feedback/types.ts`, `lib/feedback/service.ts`, `tests/unit/telegram-feedback.test.ts`.

1. Add `/start` payload handling for supported deep-link types.
2. Add callback handlers for type, next, back, skip, confirm, edit, and cancel.
3. Accept text and photo/document metadata in private chat only.
4. Convert the completed draft into the existing sanitized feedback input.
5. Call the existing durable-first feedback service and show ticket/status buttons.
6. Retain direct slash-command reports as a compatibility path.
7. Test every wizard transition and ensure a failed optional side effect cannot lose the report.

## Step 4: lifecycle and admin actions

Files: `supabase/migrations/20260905000300_feedback_report_lifecycle.sql`, `lib/feedback/admin.ts`, `lib/telegram-feedback-admin.ts`, `tests/unit/telegram-admin.test.ts`.

1. Add report lifecycle columns and safe update operations.
2. Render sanitized admin cards with status and GitHub links.
3. Implement admin-only Assign, Need info, Reprocess AI, Create GitHub, Notify user, Resolve, and Close callbacks.
4. Check admin chat and admin user for every callback and command.
5. Test authorization, idempotency, state transitions, notification failures, and callback replay.

## Step 5: Community Bot

Files: `lib/telegram-community.ts`, `app/api/telegram/community-webhook/route.ts`, `tests/unit/telegram-community.test.ts`.

1. Add the public-group keyboard and callback routing.
2. Respond to button clicks, mentions, and replies only; ignore ordinary unrelated messages.
3. Add short deterministic help, search, discovery, movie, series, and anime responses using existing catalog clients where safe.
4. Add Feedback Bot deep links for bug, playback, UX, feature, and complaint paths.
5. Add a separate token/secret resolver and test it independently from Feedback Bot.

## Step 6: observability and configuration

Files: `lib/telegram/metrics.ts`, `docs/telegram-operations.md`, `.env.example` if present, and tests for safe logging.

1. Log event names, ticket ids, statuses, and provider health without raw message text or credentials.
2. Document both webhook URLs, Telegram BotFather setup, Privacy Mode, and Vercel variables.
3. Add health-oriented counters for received, ignored, stored, AI-failed, GitHub-failed, and admin actions.
4. Test that formatted errors redact bot tokens and sensitive URLs.

## Step 7: verification

1. Run focused Telegram/session/admin tests.
2. Run `npm test`.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Verify both webhook endpoints with a wrong secret, a valid synthetic update, and a duplicate update.
6. Configure Telegram webhooks only after deployment is ready.

## Completion checklist

- [ ] Design and plan committed on `codex/veyra-telegram-bots`.
- [ ] Feedback wizard works in private chat.
- [ ] Community Bot works in Privacy Mode.
- [ ] Admin callbacks are authorized and idempotent.
- [ ] Supabase migration is applied to the correct project.
- [ ] Both Vercel webhook secrets and bot tokens are configured.
- [ ] Tests, typecheck, and production build pass.
