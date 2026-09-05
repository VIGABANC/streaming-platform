# VEYRA production remediation report

Date: 2026-09-05
Branch: `codex/veyra-production-remediation`
Starting commit: `4d126479e40e91034b1d3763a9c9cd844bddf8d7` (`main`)
Remediation implementation commit: `f4f5954b546f8a8ef5020ba37071cef0366844bb`

## Outcome

The approved security-first remediation was implemented in an isolated
worktree while preserving `main` and VEYRA's existing “The Night Signal”
identity. Code-level verification is green. This branch is not labelled
production-ready because live Supabase migration/account testing, deployment
configuration, and real-device production performance evidence remain outside
the available environment.

## Finding status

| Finding | Result | Evidence |
|---|---|---|
| F-01 configuration | Remediated | Safe proxy fallback and explicit configuration errors; `.env.example` documents Supabase variables. |
| F-02 catalog failures | Remediated | Existing typed catalog failure states retained and covered by the production/browser checks. |
| F-03 account privacy and library persistence | Implemented; deployment pending | Server-guarded `/profile`, identity-derived cloud writes, owner-marker cleanup, strict snapshot normalization, and existing `auth.uid()` RLS migration. |
| F-04 PWA | Implemented; deployed install/offline test pending | Production-only service-worker registration/update flow, private-route cache bypasses, offline fallback, manifest, and raster icons. |
| F-05 settings integrity | Remediated | Stored settings are normalized; supported provider selection and reduced-motion behavior are consumed by playback. |
| F-06 dialog accessibility | Remediated | Labelled dialog, focus handling, Escape/close behavior, scroll locking, and Playwright coverage pass. |
| F-07 JSON-LD safety | Remediated | Script-safe serializer and hostile-content regression coverage remain intact. |
| F-08 API, route, and player hardening | Remediated | Bounded strict route parsing, allowlisted HTTPS player origins/paths, reduced iframe capabilities, consistent frame policy, and redacted search logs. |
| F-09 SEO discovery and canonical URLs | Partially remediated | Stable metadata base, canonical detail metadata, private/search noindex, robots policy, and public sitemap; dynamic catalog URL expansion remains a crawl-surface decision. |
| F-10 performance and observability | Implemented; production measurement pending | `next/font`, deferred player connection hints, existing image budgets, Web Vitals/error telemetry, and fresh local browser timing evidence. |

## Data and security boundary

Guest data remains device-local. Authenticated profile access is server-gated.
Cloud writes accept only a validated snapshot and derive the owner from the
authenticated Supabase user instead of trusting a caller-supplied ID. The
existing migration uses one row per `auth.users.id` with `auth.uid()` policies;
it must be applied and verified in the target project before account sync is
advertised as deployed. Logout and account switching clear the local owner
marker and local account state to prevent cross-account bleed.

Backup import/export now uses numeric `schemaVersion: 1`, strict Zod schemas,
bounded collections, safe IDs/timestamps/ratings, explicit legacy migration,
and validate-before-write atomic behavior. Invalid or future backups do not
mutate local storage.

Player URLs are constructed from a fixed provider registry and accepted only
when the exact HTTPS origin and expected embed path match. Dynamic media,
season, episode, genre, provider, and related detail segments reject malformed,
partial, decimal, negative, zero-invalid, leading-zero, oversized, `NaN`, and
`Infinity` values before upstream calls. The player iframe no longer receives
form or popup capabilities it does not need. Global CSP and X-Frame-Options
now consistently prevent VEYRA pages from being embedded; player origins are
not globally preconnected before playback intent.

## Verification evidence

- `npm ci` — passed; 502 packages installed, zero install-time vulnerabilities.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test -- --run` — passed: 24 files, 92 tests.
- `npm run build` — passed with Next.js 16.3.3/Turbopack; all app routes generated.
- `npm audit --omit=dev` — passed with zero production vulnerabilities.
- `npm run test:e2e` — passed: 26 tests across Chromium and Mobile Chrome,
  including browser console-error assertions on the landing performance probe.
- Fresh performance probe — passed in Chromium 1280×720 and Mobile Chrome
  393×727; detailed local-only timings are in `PAGESPEED_BASELINE.md`.
- Supplied historical PageSpeed reports — inspected and recorded without
  treating `/audit` SEO results as catalog SEO results.

## Release gates outside this worktree

1. Apply and verify `supabase/migrations/202609050001_create_user_library_snapshots.sql`
   in the target Supabase project.
2. Run authenticated multi-user, account-switch, logout, and multi-device
   sync tests with valid project credentials.
3. Deploy and run real-device Lighthouse/PageSpeed plus install/offline/update
   checks. Recheck production CSP, route status behavior, catalog credentials,
   and field Web Vitals.
4. Decide whether bounded, source-backed dynamic catalog URLs belong in the
   public sitemap; do not expand it from unbounded upstream results.

Until those gates are complete, the accurate verdict is **CODE-VERIFIED WITH
DEPLOYMENT GATES**, not “production ready.”
