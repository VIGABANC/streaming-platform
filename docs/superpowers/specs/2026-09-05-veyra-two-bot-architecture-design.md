# VEYRA Two-Bot Telegram Experience Design

**Date:** 2026-09-05  
**Status:** Approved for implementation  
**Decision:** Two bots, private feedback wizard, privacy-first public group

## Goal

Make VEYRA's Telegram experience easy for community members and useful for the engineering team without collecting bug details in a public group. The community experience and the operational feedback workflow are separate product surfaces with separate bot credentials and webhooks.

## Product surfaces

### VEYRA Community Bot

The Community Bot lives in the public group. It answers short VEYRA-related questions, helps users discover movies, series and anime, and routes operational requests to the Feedback Bot. It is not a general-purpose assistant and never exposes implementation details, credentials, infrastructure, or private reports.

The bot uses Telegram Privacy Mode. It responds to its own inline buttons, direct mentions, and replies to its messages. It does not read or answer every ordinary group message. This keeps group noise low and avoids silently processing unrelated conversation.

Primary keyboard:

```text
🎬 Discover     🔎 Search VEYRA
🎭 Movies       📺 Series
🍥 Anime        🆘 Help
🐛 Report       💡 Suggest feature
```

The first release uses deterministic VEYRA/TMDB/AniList catalog operations wherever possible. AI may classify the user's intent or produce a concise grounded explanation, but it must not invent titles, links, availability, or VEYRA capabilities. Results are limited to three to five recommendations.

### VEYRA Feedback Bot

The Feedback Bot is opened in a private chat through a deep link. It owns the report wizard and remains compatible with the existing slash-command interface. The public group does not collect report descriptions.

Deep-link examples:

```text
https://t.me/<feedback_bot_username>?start=bug
https://t.me/<feedback_bot_username>?start=playback
https://t.me/<feedback_bot_username>?start=feature
https://t.me/<feedback_bot_username>?start=complaint
```

Wizard:

```text
Choose type → describe what happened → optional page/title → optional attachment → review → submit
```

Every step has `Back`, `Cancel`, and a safe retry path. The report is stored before AI or GitHub work begins. The user receives a ticket immediately after durable storage, even when AI, GitHub, or Telegram notification later fails.

### Private admin group

The Feedback Bot may be added to the private admin group. It posts sanitized report cards and handles admin-only callbacks. Every callback checks the configured admin chat and configured admin user identity on the server; callback data is never treated as authorization.

## Conversation contract

### Community answers

- Keep answers to two to six lines unless the user asks for more.
- Match the language used: English, Arabic, Moroccan Darija, or French.
- Prefer buttons over long instructions.
- For a problem, acknowledge it briefly and offer a deep link to Feedback Bot.
- For unsupported or unrelated topics, politely say that the bot is focused on VEYRA.
- Never provide source code, environment variables, provider secrets, Supabase/Vercel/GitHub internals, or deployment information.

### Feedback wizard

The wizard starts with a preselected type when a deep link contains a supported `start` payload. The user can change it before entering the description.

Supported types: `bug`, `playback`, `ux`, `feature`, `complaint`. Search and streaming links map to the closest supported type while preserving the source context.

The review card shows type, description, context, attachment count, and privacy guidance. On submit, a sanitized report is persisted with the Telegram chat/message id as the idempotency key. The bot then replies with the ticket and current status.

### Admin card

```text
🆕 VEYRA Report
Ticket: VEYRA-YYYYMMDD-XXXXXXXX
Type: Playback · Severity: P1
Status: AI_PENDING · GitHub: PENDING

Summary:
...

[Assign] [Need info]
[Reprocess AI] [Create GitHub]
[Notify user] [Resolve] [Close]
```

The card never includes credentials. User identity is minimized to a Telegram id and display name when available, and sensitive text is sanitized before it is copied into an admin message or GitHub issue.

## State and persistence

Add a server-side Telegram session table for wizard state. A session is keyed by bot identity, chat id, and user id, expires after 30 minutes of inactivity, and stores only the current step plus sanitized draft data. Do not store raw bot updates.

Extend feedback persistence with the report lifecycle fields needed by the admin queue: public status, assignee, admin message id, user notification state, and timestamps. Keep the existing AI/GitHub fields and the `(chat_id, message_id)` uniqueness constraint for idempotency.

Recommended lifecycle:

```text
DRAFT → AWAITING_DESCRIPTION → AWAITING_CONTEXT → CONFIRMING
→ STORED → AI_PENDING → SUCCESS | AI_UNAVAILABLE
→ GITHUB_CREATED | GITHUB_PENDING → IN_REVIEW
→ NEED_INFO → RESOLVED | CLOSED
```

AI and GitHub failures are recoverable states, never reasons to discard a stored report.

## Webhooks and configuration

Keep the existing Feedback webhook contract and add a separate Community webhook route. New deployments should use separate credentials:

```text
TELEGRAM_FEEDBACK_BOT_TOKEN
TELEGRAM_FEEDBACK_WEBHOOK_SECRET
TELEGRAM_COMMUNITY_BOT_TOKEN
TELEGRAM_COMMUNITY_WEBHOOK_SECRET
TELEGRAM_ADMIN_CHAT_IDS
TELEGRAM_ADMIN_USER_IDS
TELEGRAM_FEEDBACK_BOT_USERNAME
```

For backward compatibility, `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET` continue to work as Feedback Bot fallbacks until the new names are configured. Secrets are server-only and never rendered in messages or logs.

## AI and catalog boundaries

Feedback AI reuses the existing router and deterministic fallback. Community AI is a separate intent layer and must call catalog functions for factual title information. A missing AI key must not disable buttons, deterministic help, report storage, or admin status. `/aistatus` reports health labels only and never model names, keys, quotas, or raw provider errors.

## Security and reliability

- Validate webhook secrets independently for each bot.
- Rate-limit Community Bot replies per chat/user.
- Use compact, signed or server-validated callback identifiers.
- Verify admin chat, admin user, and report ownership for every admin action.
- Deduplicate Telegram retries before sending side effects.
- Escape or safely format user text when rendering Markdown/HTML.
- Do not place secrets, raw stack traces, or private URLs in Telegram messages.
- Keep the public bot in Privacy Mode and do not add Feedback Bot to the public group unless a deep-link entry point is needed.

## Success criteria

1. A user presses `Report` in the public group and reaches a private Feedback Bot wizard with the type preselected.
2. A completed report is visible in Supabase before AI or GitHub processing.
3. The user receives a ticket even if AI or GitHub is unavailable.
4. Admins receive a sanitized card and can perform each allowed action with buttons.
5. Community Bot answers supported VEYRA questions with short grounded responses and useful links.
6. Non-admins cannot run admin commands or callbacks.
7. Telegram retries do not create duplicate reports or duplicate GitHub issues.
8. Existing `/bug`, `/playback`, `/ux`, `/feature`, `/complaint`, `/aistatus`, and `/reprocess` behavior remains functional.

## Rollout

1. Add session/lifecycle schema and shared Telegram primitives.
2. Implement Feedback Bot wizard and admin callbacks behind the existing webhook.
3. Add Community Bot route, buttons, catalog responses, and deep links.
4. Configure both Telegram webhooks and Vercel variables.
5. Run unit, integration, build, and production smoke tests.
6. Enable AI enrichment progressively after deterministic flows are verified.
