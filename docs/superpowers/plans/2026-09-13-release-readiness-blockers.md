# Release Readiness Blockers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve code-owned VEYRA release blockers without claiming DNS or third-party-provider verification.

**Architecture:** Add a focused Jikan catalog adapter and Anime page, centralize labelled navigation, preserve canonical sitemap URLs, and harden request/auth state boundaries with tests.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Playwright, Supabase SSR.

**Spec:** `docs/superpowers/specs/2026-09-13-release-readiness-blockers-design.md`

## Global Constraints

- Preserve existing uncommitted verification work and all existing tests.
- Do not deploy or push.
- Keep DNS as an external blocker until the configured production host resolves and is tested.

---

### Task 1: Accessible catalog IA and Anime discovery

**Files:** `components/layout/Header.tsx`, `components/layout/MobileNav.tsx`, `app/anime/page.tsx`, `lib/jikan/client.ts`, `tests/e2e/anime.spec.ts`

- [ ] Add labelled desktop/mobile links for each core catalog and library area.
- [ ] Add an Anime page backed by a bounded cached Jikan top-anime request, with honest unavailable-playback copy.
- [ ] Add route/navigation assertions and run focused E2E tests.

### Task 2: SEO and security boundaries

**Files:** `app/sitemap.ts`, `app/api/telegram/webhook/route.ts`, `lib/http/rate-limit.ts`, corresponding unit tests

- [ ] Emit only routes supported by the app and stable genre/provider catalog URLs.
- [ ] Reject every Telegram request when the webhook secret is missing or invalid.
- [ ] Prefer the platform-supplied trusted identity header, falling back to anonymous instead of client-forgeable forwarding headers.
- [ ] Add tests and run focused unit tests.

### Task 3: Library and focus behavior

**Files:** `components/library/LibrarySync.tsx`, `components/layout/Header.tsx`, `app/settings/page.tsx`, tests

- [ ] Handle signed-out state without clearing anonymous data and preserve same-user merge behavior.
- [ ] Add keyboard focus return/Escape behavior for account menu and reset confirmation.
- [ ] Run focused unit/E2E coverage.

### Task 4: Verification and report

- [ ] Run lint, typecheck, unit/integration, E2E, build, and production audit.
- [ ] Update the report with evidence and retain unresolved external DNS/live-service gates.
- [ ] Make focused commits containing only files owned by this task.
