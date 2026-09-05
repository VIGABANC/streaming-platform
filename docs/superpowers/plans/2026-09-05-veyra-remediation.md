# VEYRA Full Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix and verify every confirmed finding from `AUDIT_REPORT.md` without redesigning VEYRA or making unsupported production claims.

**Architecture:** Build shared typed boundaries for configuration, TMDB failures, library persistence, safe JSON-LD, route validation, and browser lifecycle. Keep guest local storage available, add RLS-backed authenticated persistence through a repository, and make every user-visible state reflect verified backend behavior.

**Tech Stack:** Next.js 16 App Router/proxy, React 19, TypeScript, Supabase SSR, Vitest, Playwright, GSAP, Web App Manifest, service worker.

**Spec:** `docs/superpowers/specs/2026-09-05-veyra-remediation-design.md` and `AUDIT_REPORT.md`.

## Global Constraints

- Never expose service-role keys, database passwords, or private admin credentials in `NEXT_PUBLIC_*` variables.
- Guests remain local-first; cloud writes must be truthful and failure-safe.
- Every user-owned Supabase table has RLS and `auth.uid()` ownership checks.
- Do not cache authenticated responses, `/api/*`, `/watch/*`, or third-party player content in the service worker.
- No raw search terms or provider URLs in telemetry/error logs.
- Every changed behavior gets a regression test; watch each new test fail before implementation.
- Preserve existing security headers, restricted image origins, navigation landmarks, player validation, and recovery UI.

---

### Task 1: Establish clean baseline and repository boundaries

**Files:**
- Modify: `eslint.config.mjs`
- Modify: `playwright.config.ts`
- Create: `docs/superpowers/specs/2026-09-05-veyra-remediation-design.md`
- Create: `docs/superpowers/plans/2026-09-05-veyra-remediation.md`
- Test: existing `tests/` and `tests/e2e/`

**Interfaces:**
- Produces a lint command that only evaluates the application checkout.
- Produces deterministic E2E environment variables for local/stubbed Supabase and TMDB behavior.

- [ ] **Step 1: Capture baseline.** Run `git status --short`, `git rev-parse HEAD`, `git branch --show-current`, `npm ci`, `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run build`, `npm audit --omit=dev`, and `npm run test:e2e`; record exact outcomes in the remediation report draft.
- [ ] **Step 2: Reproduce lint contamination.** Run `npx eslint . --debug` and confirm the failure originates under `.worktrees/veyra-telegram-feedback`, not the main checkout.
- [ ] **Step 3: Write a failing boundary test/check.** Configure ESLint ignores for `.worktrees`, `.next`, `test-results`, and `node_modules`, then run `npm run lint` and verify the unrelated checkout is absent from output.
- [ ] **Step 4: Make E2E boot deterministic.** Add non-secret test defaults in `playwright.config.ts` or the web-server environment so the app can boot without a real Supabase/TMDB project; keep live integration variables overridable.
- [ ] **Step 5: Verify.** Run `npm run lint` and a smoke E2E test; expected results are no nested-worktree lint errors and a browser-visible shell.

### Task 2: Fix Supabase configuration and proxy behavior

**Files:**
- Modify: `.env.example`
- Create: `lib/config.ts`
- Modify: `lib/supabase/proxy.ts`
- Modify: `lib/supabase/server.ts`
- Modify: `lib/supabase/client.ts`
- Modify: `proxy.ts`
- Modify: `app/auth/login/page.tsx`
- Modify: `app/auth/sign-up/page.tsx`
- Test: `tests/unit/config.test.ts`, `tests/unit/supabase-config.test.ts`

**Interfaces:**
- `getPublicSupabaseConfig(): { url: string; key: string } | null`
- `isSupabaseConfigured(): boolean`
- `getSupabaseConfigError(): string`

- [ ] **Step 1: Write failing tests** for missing/valid public configuration and for proxy pass-through when auth is optional and configuration is absent.
- [ ] **Step 2: Run focused tests** with `npm test -- --run tests/unit/config.test.ts tests/unit/supabase-config.test.ts`; expected failure is missing config helpers/behavior.
- [ ] **Step 3: Implement config parsing** using only `NEXT_PUBLIC_SUPABASE_URL` and publishable/anon key; reject empty or malformed values and never throw from the browsing proxy.
- [ ] **Step 4: Add `.env.example` placeholders** for URL and publishable key; retain server-only TMDB key as a clearly fake placeholder, not a credential-shaped value.
- [ ] **Step 5: Make auth UI actionable** when Supabase is not configured; preserve browsing and return a stable user-facing setup error for login/signup.
- [ ] **Step 6: Verify** focused tests, local dev without Supabase, and E2E shell boot.

### Task 3: Centralize TMDB errors and make catalog failures explicit

**Files:**
- Modify: `lib/tmdb.ts`
- Create: `lib/catalog.tsx` or `components/catalog/CatalogState.tsx`
- Modify: `app/page.tsx`, `app/movies/page.tsx`, `app/tv/page.tsx`, `app/discover/page.tsx`
- Modify: provider/catalog routes that duplicate `safe*` loaders
- Test: `tests/unit/tmdb-errors.test.ts`, `tests/unit/catalog-state.test.ts`

**Interfaces:**
- `TMDBError.code: 'CONFIGURATION' | 'AUTHENTICATION' | 'RATE_LIMITED' | 'NETWORK' | 'INVALID_RESPONSE' | 'NOT_FOUND'`
- `CatalogResult<T> = { status: 'success' | 'empty' | 'failure'; data: T; error?: CatalogError }`
- `loadCatalogRail<T>(loader: () => Promise<T>): Promise<CatalogResult<T>>`

- [ ] **Step 1: Write failing tests** for success, true empty, one failed rail, total failure, and sanitized UI copy.
- [ ] **Step 2: Run focused tests** and confirm they fail because current loaders return `[]` for errors.
- [ ] **Step 3: Implement typed TMDB error mapping** for missing key, 401, 404, 429, network, malformed response, and generic upstream failures.
- [ ] **Step 4: Implement explicit state rendering** with accessible `role="status"`/`role="alert"`, retry controls, and distinct empty vs unavailable copy.
- [ ] **Step 5: Refactor home rails** to render successful rails independently and a total-outage state only when every required feed fails.
- [ ] **Step 6: Refactor movies/TV/discover** to preserve headers and filters while showing retryable failures.
- [ ] **Step 7: Verify** focused tests, invalid-TMDB runtime, and a deterministic one-rail failure fixture.

### Task 4: Add Supabase-backed library repository and migration

**Files:**
- Create: `supabase/migrations/<timestamp>_create_user_library.sql`
- Create: `lib/library/types.ts`
- Create: `lib/library/local-repository.ts`
- Create: `lib/library/cloud-repository.ts`
- Create: `lib/library/repository.ts`
- Modify: `lib/store.ts`
- Modify: library pages/components and auth callback
- Test: `tests/unit/library-merge.test.ts`, `tests/unit/library-repository.test.ts`, `tests/unit/store-compatibility.test.ts`
- Create: `docs/library-consistency.md`

**Interfaces:**
- `LibraryItemKey = { mediaType: 'movie' | 'tv'; mediaId: number }`
- `LibraryRepository` CRUD methods for watchlist, favorites, ratings, history, progress, profile, and settings.
- `mergeLocalLibrary(local, cloud): MergedLibrary` with union collections and latest-update conflict resolution.

- [ ] **Step 1: Write failing merge/RLS-shape tests** covering deduplication, latest progress, union favorites/watchlist, and no user-id trust.
- [ ] **Step 2: Run tests red.** Confirm repository interfaces and merge function are absent.
- [ ] **Step 3: Create normalized migration** with user-owned tables keyed to `auth.users(id)`, timestamps, stable media identity, unique constraints, indexes, and explicit SELECT/INSERT/UPDATE/DELETE RLS policies using `auth.uid()`.
- [ ] **Step 4: Implement local repository adapter** over current store data without changing guest behavior.
- [ ] **Step 5: Implement cloud repository adapter** using the server/client Supabase clients and authenticated user context; never accept arbitrary client user IDs.
- [ ] **Step 6: Implement login merge** after successful session exchange, retaining local state on failures and exposing sync status.
- [ ] **Step 7: Update auth copy** only for behavior that exists; document migration/application requirement and consistency model.
- [ ] **Step 8: Verify** unit tests, migration SQL review, and no privileged key exposure.

### Task 5: Activate safe PWA lifecycle

**Files:**
- Create: `components/pwa/ServiceWorkerRegistration.tsx`
- Modify: `app/layout.tsx`
- Modify: `public/sw.js`
- Modify: `public/manifest.json`
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`
- Test: `tests/unit/sw-policy.test.ts`, `tests/e2e/pwa.spec.ts`

**Interfaces:**
- Registration boundary emits update/error status without coupling pages to service-worker internals.
- Cache names include a version and never match `/api`, `/watch`, auth, or external origins.

- [ ] **Step 1: Write failing policy tests** for registration source, cache exclusions, versioned cache name, and required icon sizes.
- [ ] **Step 2: Implement one production-only registration boundary** with update detection and a non-blocking update/reload affordance.
- [ ] **Step 3: Harden `sw.js`** with versioned caches, navigation fallback, safe static caching, and explicit bypass for personal/API/player routes.
- [ ] **Step 4: Add branded 192/512/maskable PNGs** and valid manifest references.
- [ ] **Step 5: Verify** production build, browser registration, manifest, offline fallback, and update lifecycle with a controlled local server.

### Task 6: Make settings real and fix the accessible filter dialog

**Files:**
- Modify: `lib/store.ts`
- Modify: `components/player/PlayerFrame.tsx`
- Modify: watch/player episode components
- Modify: `components/discover/DiscoverFilters.tsx`
- Test: `tests/unit/settings.test.ts`, `tests/e2e/settings.spec.ts`, `tests/e2e/discover-dialog.spec.ts`

**Interfaces:**
- `normalizeUserSettings(input): UserSettings`
- `getInitialProviderId(settings): ProviderId`
- `shouldReduceMotion(settings, mediaQuery): boolean`

- [ ] **Step 1: Write failing setting tests** for default provider, changed provider, invalid provider fallback, persistence, and reduced-motion precedence.
- [ ] **Step 2: Implement setting normalization** and wire selected provider to initial iframe source.
- [ ] **Step 3: Implement a real ambient-lighting class/effect** with reduced-motion suppression, or remove the setting if no meaningful effect can be verified.
- [ ] **Step 4: Remove/reword stream quality and autoplay controls unless the player/episode architecture supports them; do not leave placebo settings.**
- [ ] **Step 5: Add dialog semantics/focus trap/Escape/focus return/body scroll lock and accessible close name to the mobile filter sheet.**
- [ ] **Step 6: Verify** keyboard interaction at 390px and settings persistence after reload.

### Task 7: Harden JSON-LD, API validation, throttling, and logs

**Files:**
- Create: `lib/seo/json-ld.ts`
- Modify: movie/TV detail pages using JSON-LD
- Create: `lib/http/rate-limit.ts`
- Create: `lib/http/request-id.ts`
- Modify: `app/api/search/route.ts`
- Modify: `app/api/tv/[id]/season/[season]/route.ts`
- Test: `tests/unit/json-ld.test.ts`, `tests/unit/route-validation.test.ts`, `tests/unit/rate-limit.test.ts`, `tests/e2e/api-hardening.spec.ts`

**Interfaces:**
- `serializeJsonLd(value): string` escapes HTML script-context characters while remaining valid JSON.
- `parsePositiveIntSegment(value, range): number | null` rejects partial forms such as `1abc`.
- `checkRateLimit(identity, policy): RateLimitDecision` returns retry metadata.

- [ ] **Step 1: Write red security tests** with hostile script values, Unicode separators, partial IDs, rate-limit exhaustion, and no raw query in logs.
- [ ] **Step 2: Implement and use one safe JSON-LD serializer** for movie and TV structured data.
- [ ] **Step 3: Implement strict route validation and stable public error codes** without returning raw provider messages.
- [ ] **Step 4: Add bounded deployment-aware throttling** with a documented local fallback and `429`/`Retry-After` headers.
- [ ] **Step 5: Remove raw search text from failure logs** and retain request ID/category/query length only.
- [ ] **Step 6: Verify** unit security suite and API responses under repeated requests.

### Task 8: Correct SEO and measure/fix performance and observability

**Files:**
- Modify: `app/layout.tsx`
- Modify: page metadata files and `app/search/page.tsx`, `app/audit/page.tsx`
- Modify: `app/sitemap.ts`, `app/robots.ts`
- Modify: `components/landing/CinematicHero.tsx`, `components/media/MediaGrid.tsx` or equivalent
- Create: `lib/observability/index.ts`
- Create: `components/observability/WebVitals.tsx`
- Test: `tests/unit/seo.test.ts`, `tests/unit/observability.test.ts`

**Interfaces:**
- Stable `metadataBase` and canonical URL helper.
- `buildSitemapEntries()` returns bounded canonical public entries with honest `lastModified` or omission.
- `reportClientError(event)` accepts sanitized categories and route metadata only.

- [ ] **Step 1: Write red SEO tests** for canonical/base metadata, search/audit noindex, sitemap omissions, and stable last-modified behavior.
- [ ] **Step 2: Implement metadata and sitemap strategy** without indexing arbitrary search queries or internal audit surfaces.
- [ ] **Step 3: Run production performance measurement** and record LCP, CLS, INP, TTFB, transfer size, hero bytes, initial JS, and font behavior at mobile and desktop profiles.
- [ ] **Step 4: Optimize only measured bottlenecks**: use `next/font` or equivalent, right-size hero sources, and prioritize only the true LCP image.
- [ ] **Step 5: Add provider-agnostic Web Vitals/runtime/TMDB/player reporting** with query/URL redaction and no fabricated provider integration.
- [ ] **Step 6: Verify** SEO unit tests, built metadata/sitemap, and repeat measurements.

### Task 9: Expand browser coverage and update audit surfaces

**Files:**
- Modify/create: `tests/e2e/*.spec.ts`
- Modify: `app/audit/page.tsx`, `components/audit/AuditReport.tsx`
- Create: `REMEDIATION_REPORT.md`

- [ ] **Step 1: Add deterministic E2E coverage** for home, catalog failure/empty, search, provider, movie/TV detail, mobile filter dialog, settings, watchlist/favorites/history, auth shell, and PWA registration.
- [ ] **Step 2: Run visual QA** at 390×844, 768×1024, and 1440×900; record changed surfaces and any remaining issue.
- [ ] **Step 3: Build a finding status table** for F-01 through F-10 with before state, after evidence, final status, and production limitations.
- [ ] **Step 4: Update `/audit`** from measured results; keep it `noindex` and do not replace findings with a score-only claim.
- [ ] **Step 5: Write `REMEDIATION_REPORT.md`** with executive summary, fixed/partial/blocker findings, database/security/accessibility/SEO/PWA/performance changes, test evidence, E2E evidence, limitations, and release verdict.

### Task 10: Independent review and final verification

**Files:**
- Review all changed files and `REMEDIATION_REPORT.md`

- [ ] **Step 1: Request code/security review** against JSON-LD escaping, rate limiting, logging, validation, Supabase RLS, environment handling, and client exposure.
- [ ] **Step 2: Fix every Critical/Important review issue** with a failing regression test first.
- [ ] **Step 3: Run the complete final gate:** `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run build`, `npm audit --omit=dev`, `npm run test:e2e`, plus accessibility/PWA/SEO/security/performance checks.
- [ ] **Step 4: Inspect `git diff`, generated route behavior, browser console, and runtime logs** for newly introduced errors.
- [ ] **Step 5: Use the finishing workflow only after all evidence is current**, then present the required branch integration options without merging or deleting work unilaterally.
