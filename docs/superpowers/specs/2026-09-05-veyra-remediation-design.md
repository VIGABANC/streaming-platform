# VEYRA Remediation Design

## Goal

Turn VEYRA from a buildable MVP into a truthful, reliable, production-ready streaming discovery application while preserving its cinematic identity.

## Scope and constraints

- Fix the ten confirmed findings in `AUDIT_REPORT.md`.
- Preserve server-side TMDB access, the current CSP/frame policies, skip navigation, loading/error regions, player validation, and player recovery states.
- Do not add privileged Supabase credentials to public environment variables.
- Guests remain local-first; authenticated users receive account-backed library synchronization after the migration is applied.
- Do not claim live cloud sync, PWA installability, or offline behavior without runtime evidence.
- Avoid live TMDB dependencies in regression tests; use deterministic fixtures and injected loaders.

## Architecture

The remediation uses small shared primitives rather than a broad rewrite. A typed TMDB result/error boundary feeds explicit catalog states; a local/cloud library repository keeps guest behavior available and makes authenticated writes truthful; a single client bootstrap owns service-worker registration; and narrow utilities own settings validation, JSON-LD serialization, route validation, and request throttling.

Supabase persistence uses normalized user-owned rows keyed by `auth.users.id`, with RLS policies for every CRUD operation. Local guest data is merged on login by stable media identity: set-like collections union, ratings choose the most recently updated value, and progress chooses the latest `updatedAt`. If cloud writes fail, local state remains and the UI reports a pending/failed sync rather than success.

## Workstreams

### 1. Boot/configuration and test boundary

Add documented Supabase public placeholders and a safe configuration helper. Make browsing work when auth is not configured, while auth actions show an actionable configuration error. Exclude nested `.worktrees` and generated output from the root lint boundary. Add deterministic E2E env defaults and a local stub path so browser tests can boot without production credentials.

### 2. Catalog reliability

Introduce typed TMDB failures and a `CatalogResult<T>` shape. Refactor home, movie, TV, provider, and discover loaders to preserve partial successes and distinguish empty data from failed data. Add retryable, accessible outage states without exposing provider internals.

### 3. Account library

Add a Supabase migration for watchlist, favorites, ratings, history, continue-watching progress, and profile/settings metadata. Add RLS policies using `auth.uid()` ownership checks. Implement a repository boundary with local and cloud implementations, deterministic merge, and truthful sync status. Until a real project applies the migration, production sync remains explicitly documented as pending.

### 4. PWA lifecycle

Add a single client registration boundary, update notification/reload behavior, cache versioning, safe navigation/static caching, and valid 192px/512px branded icons. Do not cache `/api`, `/watch`, authenticated routes, or third-party players.

### 5. Settings and accessibility

Validate saved settings and wire default provider, ambient lighting, reduced motion, and quality semantics to actual behavior. Remove or reword autoplay if full episode sequencing cannot be implemented honestly. Convert the mobile filter sheet into a labelled modal with focus management, Escape handling, focus restoration, and scroll locking.

### 6. Security and public APIs

Centralize script-context-safe JSON-LD serialization. Strictly validate IDs and seasons, return stable public error codes, redact search logs, add deployment-compatible rate limiting with `429`/`Retry-After`, and use bounded request caching without leaking personal data.

### 7. SEO, performance, observability

Add stable `metadataBase`, canonical URLs, social metadata, `/search` and `/audit` noindex policy, and a bounded sitemap strategy with honest `lastModified`. Measure production output before tuning fonts/images; then use optimized font loading and true-LCP priority. Add provider-agnostic Web Vitals/runtime/TMDB/player error hooks with no sensitive URL/query logging.

### 8. Verification and reporting

Expand unit/integration/E2E coverage for all changed behaviors, run 390×844, 768×1024, and 1440×900 visual checks, request security/code review, re-run the full gate, update `/audit` from evidence, and write `REMEDIATION_REPORT.md` with before/after status and production limitations.

## Failure and rollout policy

- Missing configuration must never produce a framework runtime overlay for basic browsing.
- A failed upstream request must never be represented as a successful empty catalog.
- A local action must never be discarded because the cloud is unavailable.
- A UI control must not remain visible unless it has a verified runtime effect.
- A migration is code-complete only when its SQL, policies, repository behavior, and tests are present; live sync is complete only after a real project applies and verifies it.
