# VEYRA Production Readiness Design

## Goal

Close the remaining release-risk gaps in the existing VEYRA remediation while preserving “VEYRA — The Night Signal”, the public discovery experience, guest browsing, and the current cinematic visual language.

## Current evidence

- Starting commit: `4d126479e40e91034b1d3763a9c9cd844bddf8d7` on `main`.
- The isolated branch baseline passes typecheck, lint, 20 Vitest files/78 tests, production build, dependency audit, and 20 Playwright tests.
- Existing remediation already covers typed catalog failures, safe JSON-LD serialization, rate-limited search responses, PWA registration scaffolding, settings wiring, and the mobile filter dialog.
- Fresh source verification still finds weak backup normalization/import behavior, public client-only profile access, loose TV watch-page route coercion, inconsistent player-origin validation, contradictory frame policy, incomplete canonical sitemap coverage, and no live authenticated Supabase/RLS evidence.

## Architecture

Keep a public, server-rendered discovery surface and a local-first guest library. Treat account state as a separate authenticated boundary: `/profile` becomes server-guarded, the client sync adapter derives identity from `supabase.auth.getUser()`, and the cloud snapshot remains protected by `auth.uid()` RLS. Local-to-cloud merge stays deterministic and failure-safe; logout clears the account owner marker and authenticated cache without destroying explicit guest data.

Centralize all trust-boundary primitives. A strict Zod backup schema owns export/import validation and schema-version migration; one positive-integer route parser is used by pages and handlers; one player configuration module owns the fixed provider registry, URL construction, and origin allowlist; and one header policy declares whether VEYRA pages are embeddable. Invalid input fails closed with stable public errors and never produces misleading playback or partial storage writes.

## Workstreams

### 1. Account privacy and persistence

Guard the profile/account surface server-side, add an explicit sign-out path, and make copy distinguish guest/device-local data from authenticated cloud data. Harden the snapshot repository so it never trusts a caller-supplied owner ID and add schema validation before cloud writes. Preserve the existing migration/RLS design, add regression checks for cross-user isolation and account switching, and document the live Supabase migration as a deployment gate when credentials are unavailable.

### 2. Backup and route integrity

Define a bounded `schemaVersion: 1` backup format with strict field types, media identity/range checks, date/timestamp validation, rating/progress bounds, maximum collection sizes, and an explicit unknown-field policy. Imports validate the complete payload before any storage mutation and return typed outcomes. All movie/TV/season/episode route segments reject partial, decimal, negative, zero-invalid, huge, `NaN`, and `Infinity` values.

### 3. Player and HTTP security

Allow only the configured provider origins and expected embed paths. Remove provider-brand aliases that imply VEYRA ownership, restrict iframe capabilities to playback requirements, remove player-origin preconnects from the global layout, and make CSP plus `X-Frame-Options` consistent with the chosen requirement that VEYRA pages are not embeddable. Preserve player loading, timeout, retry, offline, and fallback states.

### 4. SEO, PWA, performance, and observability

Make canonical and social metadata deterministic, keep search/audit/private pages out of indexing, and expand the sitemap only from bounded public routes with honest timestamps. Verify the service-worker lifecycle and cache exclusions. Measure mobile and desktop production-mode traces before changing loading priorities; retain `next/font`, right-sized hero imagery, lazy catalog media, and privacy-safe Web Vitals/error events.

### 5. Verification and release evidence

Use unit tests for pure security/data primitives, Playwright tests for route guards, dialog behavior, settings/player semantics, console cleanliness, and responsive flows, plus source/runtime checks for headers, sitemap, manifest, service worker, and browser behavior. Update `/audit`, `PAGESPEED_BASELINE.md`, and `REMEDIATION_REPORT.md` only with observed evidence. The verdict cannot be `PRODUCTION READY` while live Supabase migration/account tests or production-device measurement remain unavailable.

## Failure policy

- Browsing remains available when optional auth configuration is absent.
- Account routes never render another user’s local or cloud state.
- Invalid backups fail atomically with user-readable, non-raw errors.
- Invalid route parameters never fall back to a valid episode.
- Untrusted player URLs are rejected before iframe rendering.
- Upstream failures remain distinguishable from empty catalog results.
- No report, audit page, or final response claims live credentials, RLS, PWA installability, or PageSpeed results that were not observed.

## Specialist skill ledger

| Domain | Skill/source | Use |
|---|---|---|
| Process | `superpowers:using-superpowers`, `brainstorming`, `writing-plans`, `using-git-worktrees`, `systematic-debugging`, `test-driven-development`, `requesting-code-review`, `receiving-code-review`, `verification-before-completion`, `finishing-a-development-branch` | Govern the workflow, isolation, TDD, review, verification, and handoff |
| Next.js / React | `vercel:react-best-practices` plus local Next 16 `dist/docs` | Server/client boundaries, route params, metadata, proxy, images, fonts |
| Supabase | `supabase:supabase` and `supabase:supabase-postgres-best-practices` | SSR auth, ownership, persistence, and RLS |
| Security | `secure-project-engineer` / `security-review-ecosystem` | Input validation, output encoding, CSP, iframe trust, privacy |
| Accessibility | `accessibility-review` | Dialog, focus, semantic controls, reduced motion, touch targets |
| SEO | `design-system`/SEO guidance and local Next metadata docs | Canonical metadata, sitemap, robots, structured data |
| Performance | `ultra-performance-engineer` and local Next image/font docs | Measurement-led LCP, JS, image, font, and field telemetry work |
| GSAP | `gsap-react`, `gsap-performance`, `motion-principles` | Cleanup, responsive timelines, and reduced motion |
| Testing | `vercel:agent-browser-verify` plus Playwright project | Browser journeys, console/errors, responsive verification |

