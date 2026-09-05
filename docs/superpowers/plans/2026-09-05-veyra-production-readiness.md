# VEYRA Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining release-risk gaps in VEYRA and produce current evidence without overstating production readiness.

**Architecture:** Preserve the existing discovery UI and local-first guest library. Add strict boundaries for authenticated account state, backup validation, route validation, player origins, headers, metadata, and verification evidence.

**Tech Stack:** Next.js 16 App Router/proxy, React 19, TypeScript, Supabase SSR, Zod 4, Vitest, Playwright, GSAP, Web App Manifest, service worker.

**Spec:** `docs/superpowers/specs/2026-09-05-veyra-production-readiness-design.md`

## Global Constraints

- Guests remain local-first; cloud writes must be truthful and failure-safe.
- Every user-owned Supabase record is scoped to `auth.users.id` with `auth.uid()` RLS.
- Invalid backups are rejected atomically before local storage mutation.
- Invalid media, season, and episode segments never fall back to valid playback.
- Player URLs must match the fixed provider origin and expected embed path.
- Do not cache authenticated responses, `/api/*`, `/watch/*`, or third-party player content in the service worker.
- Do not log raw search terms, account data, or provider URLs.
- Preserve VEYRA’s cinematic landing identity and existing public discovery routes.
- Do not claim live Supabase, PWA, PageSpeed, or production-device evidence that was not observed.

---

### Task 1: Baseline evidence and audit reproduction

**Files:**
- Create: `PAGESPEED_BASELINE.md`
- Modify: `REMEDIATION_REPORT.md`
- Test: existing Vitest and Playwright suites

**Interfaces:**
- Produces a dated baseline table containing observed command results and historical PageSpeed evidence separately from fresh reproduction.

- [ ] **Step 1: Record repository identity and commands.** Capture branch, commit, clean status, dependency install, typecheck, lint, unit/integration tests, build, dependency audit, and E2E totals.
- [ ] **Step 2: Open the supplied historical PageSpeed URLs.** Record only metrics/audits actually exposed by the two reports, and label unavailable categories as unavailable rather than inferring them.
- [ ] **Step 3: Run a local production smoke matrix.** Check `/`, `/audit`, `/browse`, `/search`, `/provider/netflix`, `/movie/550`, `/tv/1399`, and both watch route shapes with safe placeholder configuration; capture status, title, console errors, and response headers.
- [ ] **Step 4: Add the baseline artifact.** Write `PAGESPEED_BASELINE.md` with historical A/B columns, fresh local reproduction, and an explicit credentials/production-device limitation.
- [ ] **Step 5: Verify.** Re-run the baseline commands and ensure the document contains no invented score or metric.

### Task 2: Account route protection and truthful session boundary

**Files:**
- Create: `lib/supabase/auth.ts`
- Create: `app/profile/AccountRequired.tsx`
- Modify: `app/profile/page.tsx`
- Modify: `app/settings/page.tsx`
- Modify: `components/layout/Header.tsx`
- Modify: `components/library/LibrarySync.tsx`
- Modify: `lib/library/cloud-repository.ts`
- Modify: auth pages/callback as needed
- Test: `tests/unit/auth-boundary.test.ts`, `tests/unit/library-merge.test.ts`, `tests/e2e/auth-boundary.spec.ts`

**Interfaces:**
- `getAuthenticatedUser(): Promise<{ id: string; email?: string } | null>` derives identity only from the server Supabase session.
- `signOut(): Promise<void>` clears the Supabase session and local account-owner marker without deleting explicit guest data.
- Cloud repository writes accept `snapshot` only; the repository derives `user_id` from `auth.getUser()`.

- [ ] **Step 1: Write failing tests.** Cover unauthenticated profile access, configured-session access, account switching, owner-marker clearing, and rejection of caller-supplied owner IDs.
- [ ] **Step 2: Run focused tests red.** Confirm the current client-only profile and `writeCloudLibrary(userId, ...)` behavior violate the tests.
- [ ] **Step 3: Implement a server-side session guard.** Use Next 16 server-component conventions and render a sign-in-required state or redirect without making public browsing depend on Supabase configuration.
- [ ] **Step 4: Harden cloud writes.** Remove the public `userId` parameter, fetch the authenticated user within the repository, and let RLS remain the final authorization boundary.
- [ ] **Step 5: Add sign-out and account-switch cleanup.** Clear the owner marker on sign-out, avoid displaying prior account state during the auth transition, and preserve guest state only when it is not account-owned.
- [ ] **Step 6: Make copy truthful.** State that guests have device-local data and authenticated users sync after the configured Supabase migration is applied.
- [ ] **Step 7: Verify.** Run unit tests, build, and unauthenticated E2E; document that valid account E2E remains blocked if no credentials/project are available.

### Task 3: Strict backup schema and atomic import

**Files:**
- Create: `lib/library/backup-schema.ts`
- Modify: `lib/store.ts`
- Modify: profile/settings import UX
- Modify: `lib/library/types.ts`
- Test: `tests/unit/backup-import.test.ts`, `tests/unit/store.test.ts`

**Interfaces:**
- `BACKUP_SCHEMA_VERSION = 1`.
- `parseLibraryBackup(json: string): { ok: true; snapshot: LibrarySnapshot } | { ok: false; reason: 'invalid-json' | 'unsupported-version' | 'invalid-schema' | 'too-large' }`.
- `importData(json: string): ImportResult` validates the full payload before writing any key.

- [ ] **Step 1: Write failing fixtures.** Include valid v1 data, `</script>` text, malformed arrays/objects, invalid media IDs/types, ratings outside 1–10, invalid progress/date values, oversized collections, unknown future versions, and partial payloads.
- [ ] **Step 2: Run focused tests red.** Demonstrate that the current importer accepts partial arbitrary objects and mutates storage before all fields are proven valid.
- [ ] **Step 3: Define Zod schemas.** Validate exact object shapes, positive safe IDs, `movie|tv` media types, optional TV season/episode bounds, finite timestamps/ISO dates, rating/progress ranges, and maximum collection sizes; strip or reject unknown keys consistently.
- [ ] **Step 4: Version exports.** Replace `version: '1.0'` with numeric `schemaVersion: 1`, while accepting only explicitly supported legacy `version: '1.0'` through a migration adapter.
- [ ] **Step 5: Make import atomic.** Parse and validate every section into a normalized snapshot, then write all storage keys in one commit-like operation; reject unsupported future versions without mutation.
- [ ] **Step 6: Return typed UX outcomes.** Map validation reasons to concise user-readable messages and clear the file input after every attempt.
- [ ] **Step 7: Verify.** Run focused tests and inspect local storage before/after rejected imports to prove no partial writes.

### Task 4: Strict media route and player trust boundary

**Files:**
- Modify: `lib/http/validation.ts`
- Modify: `app/watch/tv/[id]/[season]/[episode]/page.tsx`
- Modify: `app/watch/movie/[id]/page.tsx`
- Modify: `app/api/tv/[id]/season/[season]/route.ts`
- Modify: `lib/player.ts`
- Modify: `components/player/PlayerFrame.tsx`
- Modify: `next.config.mjs`, `app/layout.tsx`
- Test: `tests/unit/route-validation.test.ts`, `tests/unit/player.test.ts`, `tests/unit/player-origin.test.ts`, `tests/e2e/player-hardening.spec.ts`

**Interfaces:**
- `parsePositiveIntSegment(value: string, range: IntegerRange): number | null` remains the sole segment parser.
- `getTrustedPlayerUrl(kind, ids, providerId): URL` returns only an allowlisted origin/path or throws a stable validation error.
- `isTrustedPlayerUrl(value: string): boolean` checks protocol, exact origin, and expected embed path.

- [ ] **Step 1: Add red tests.** Cover `1abc`, `1.5`, `-1`, `0`, leading zeroes, huge values, `NaN`, `Infinity`, invalid TV route params, arbitrary provider origins, and paths outside `/embed/`.
- [ ] **Step 2: Replace page coercion.** Validate all route segments before TMDB calls; return `notFound()` or an explicit invalid-parameter page instead of defaulting season/episode to `1`.
- [ ] **Step 3: Centralize provider configuration.** Use fixed provider IDs, neutral server labels, exact HTTPS origins, and expected movie/TV embed path builders; validate the environment override before using it.
- [ ] **Step 4: Harden iframe policy.** Keep only playback capabilities required by current behavior, retain `referrerPolicy`, and never render an iframe for an untrusted URL.
- [ ] **Step 5: Resolve frame policy.** Choose the verified policy that VEYRA itself is not embeddable, remove the `/watch` `SAMEORIGIN` exception, and keep CSP `frame-ancestors` and `X-Frame-Options` consistent.
- [ ] **Step 6: Remove premature player preconnect.** Keep provider connection warmup only after a playback provider is selected/requested.
- [ ] **Step 7: Verify.** Run focused tests, built route requests, header assertions, and browser player failure/retry checks.

### Task 5: Accessibility and settings regression coverage

**Files:**
- Modify: `components/discover/DiscoverFilters.tsx`
- Modify: `app/settings/page.tsx`
- Modify: `components/player/PlayerFrame.tsx`
- Modify: relevant responsive control components
- Test: `tests/e2e/discover-dialog.spec.ts`, `tests/e2e/settings.spec.ts`, `tests/e2e/accessibility-smoke.spec.ts`, `tests/unit/settings.test.ts`

**Interfaces:**
- `normalizeUserSettings(input: unknown): UserSettings` rejects unsupported provider IDs and placebo values.
- `shouldReduceMotion(settings, mediaQueryMatches): boolean` applies the most restrictive preference.

- [ ] **Step 1: Write failing keyboard tests.** Open the mobile filter sheet, assert labelled dialog semantics, initial focus, trapped Tab/Shift+Tab, Escape close, backdrop close, focus return, and body scroll lock.
- [ ] **Step 2: Write failing settings tests.** Cover reload persistence, selected default server, invalid stored provider fallback, ambient lighting, and reduced-motion precedence.
- [ ] **Step 3: Implement or remove controls.** Preserve only settings with verified runtime effects; provide accessible names and 44px-class targets for icon-only actions.
- [ ] **Step 4: Verify motion behavior.** Test OS reduced motion and explicit VEYRA setting against hero/player/ambient effects without hiding essential content.
- [ ] **Step 5: Verify.** Run Playwright at 390×844 and 1440×900 with role/name assertions and no new console errors.

### Task 6: SEO, sitemap, PWA, and performance evidence

**Files:**
- Modify: `app/layout.tsx`, page metadata, `app/sitemap.ts`, `app/robots.ts`
- Modify: `public/manifest.json`, `public/sw.js`, PWA registration as needed
- Modify: measured image components only
- Create: `docs/performance-baseline.md`
- Test: `tests/unit/seo-routes.test.ts`, `tests/unit/pwa.test.ts`, `tests/e2e/seo-pwa.spec.ts`

**Interfaces:**
- `buildSitemapEntries(): MetadataRoute.Sitemap` emits bounded canonical public routes and omits private/search/audit/API/player paths.
- `getCanonicalUrl(path: string): string` uses one stable site origin.

- [ ] **Step 1: Write red metadata/sitemap tests.** Cover canonical base, OG/Twitter image URLs, search/audit noindex, private-route omissions, and stable last-modified behavior.
- [ ] **Step 2: Implement only evidence-backed SEO changes.** Add bounded public route coverage, remove request-time fake timestamps, and preserve `/audit` noindex.
- [ ] **Step 3: Verify PWA assets and cache policy.** Assert 192/512/maskable icon dimensions, production registration, versioned cache, offline fallback, and bypasses for private/API/watch/external origins.
- [ ] **Step 4: Measure before changing priorities.** Run production-mode mobile and desktop traces for `/`, `/browse`, `/search`, and representative detail pages; record LCP element, CLS, TBT/INP, TTFB, transfer size, hero bytes, JS, fonts, and request counts.
- [ ] **Step 5: Apply measured optimizations only.** Keep `next/font`, right-size the actual LCP artwork, remove unnecessary eager posters, and avoid third-party player preconnect before intent.
- [ ] **Step 6: Verify.** Repeat measurements, compare observed values, and label local synthetic data separately from deployed field data.

### Task 7: Review, browser matrix, and release report

**Files:**
- Modify: `app/audit/page.tsx`, `components/audit/AuditReport.tsx`
- Modify/create: `tests/e2e/*.spec.ts`
- Modify: `REMEDIATION_REPORT.md`
- Test: full project gate

- [ ] **Step 1: Request security/code review.** Review auth ownership, import atomicity, route parsing, player origin checks, CSP, logs, and public errors; record findings and resolve all important issues with tests.
- [ ] **Step 2: Run responsive browser matrix.** Inspect home, provider, search, movie/TV detail, filters, profile, settings, and player at 375×812, 390×844, 430×932, 768×1024, 1024×768, 1440×900, and 1920×1080.
- [ ] **Step 3: Run complete verification.** Execute typecheck, lint, unit/integration tests, build, audit, E2E, header/SEO/PWA checks, security fixtures, and browser console inspection.
- [ ] **Step 4: Update audit evidence.** For every original finding record before, fix, regression evidence, and final state; keep remaining external blockers explicit.
- [ ] **Step 5: Write the final report.** Include starting/final commits, skill ledger, security/auth/accessibility/SEO/PWA/performance evidence, test totals, E2E evidence, blockers, known risks, and a verdict limited to observed evidence.
- [ ] **Step 6: Verify the report itself.** Search for unsupported “production ready”, invented scores, raw credentials, and contradictions with current code/tests; correct before the final gate.

