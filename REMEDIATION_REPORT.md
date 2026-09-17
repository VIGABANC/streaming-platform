# VEYRA remediation report

Date: 2026-09-05  
Branch: `codex/veyra-remediation`

## Outcome

All ten confirmed audit findings now have an implemented code path, regression
coverage, or an explicit deployment gate. The application keeps its existing
cinematic VEYRA identity. The only work intentionally left outside the
repository is applying the Supabase migration to a real project and measuring
the deployed site with production credentials and real devices.

## Finding status

| Finding | Result | Evidence |
|---|---|---|
| F-01 configuration | Remediated | `lib/config.ts`, safe proxy fallback, explicit auth errors, `.env.example`, config tests |
| F-02 catalog failures | Remediated | `lib/catalog.ts`, typed failure states on home/movies/TV/discover, catalog tests |
| F-03 account library | Implemented; deployment pending | `lib/library/*`, `LibrarySync`, RLS migration, merge tests, consistency runbook |
| F-04 PWA | Remediated | production registration/update lifecycle, v2 cache policy, raster icons, PWA tests |
| F-05 settings | Remediated | player consumes provider/ambient/reduced-motion settings; unsupported autoplay control removed |
| F-06 dialog accessibility | Remediated | labelled modal, focus trap/return, Escape, scroll lock, Playwright dialog journey |
| F-07 JSON-LD safety | Remediated | `serializeJsonLd()` and hostile-content regression test |
| F-08 API hardening | Remediated | strict segment parser, bounded rate limiter, stable route errors, redacted search logs |
| F-09 SEO | Partially remediated | metadata base/canonicals, search noindex, public-only sitemap; dynamic catalog URL expansion remains follow-up |
| F-10 performance/observability | Implemented; production measurement pending | `next/font`, image priority/size changes, Web Vitals and client-error events |

## Persistence boundary

Guest data remains local-first. Once Supabase auth is available, the client
merges local and cloud snapshots by media identity and newest timestamp, then
upserts the merged version. A per-browser owner marker prevents one account's
local data from being uploaded to another account. Sync errors retain local
data and surface a warning; the UI does not claim a successful sync when the
cloud write failed.

Apply `supabase/migrations/202609050001_create_user_library_snapshots.sql` to
the target project before enabling this path in production. The Supabase CLI
was not installed in the workspace, and no production project credentials were
available, so live migration application was not claimed.

## Verification

- `npm ci` — passed; 502 packages installed, zero install-time vulnerabilities.
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test -- --run` — passed: 14 files, 57 tests.
- `npm run build` — passed with Next 16.3.3/Turbopack; all app routes generated.
- `npm audit --omit=dev` — passed with zero production vulnerabilities.
- `npm run test:e2e` — passed: 20 tests across Chromium and Mobile Chrome.
- Production runtime sample — `/` returned HTTP 200; at 390px the local production sample recorded TTFB 21ms, DOMContentLoaded 116ms, load 295ms, 29 resources, ~329KB transfer, and zero external Google-font requests. These are local headless measurements, not production SLOs.

The E2E harness blocks service workers and uses one worker to prevent cached
shell state and concurrent streamed-page timing from contaminating isolated
smoke assertions. PWA registration/update behavior is covered by dedicated
unit checks and should receive a deployed browser install/offline test before
release.

## Specialist skill ledger

The audit and remediation used the repository's Superpowers workflows plus
trusted local specialist guidance for Next.js/Vercel, Supabase, accessibility,
SEO, performance, security, PWA, GSAP, Playwright, and React. The mandated
`find-skills` discovery was installed globally; its CLI searches were run for
Next.js architecture, accessibility/Playwright, SEO, Supabase/RLS, API
security/rate limiting, and PWA/Core Web Vitals. Search results from unknown or
low-adoption sources were not installed blindly; existing official/curated
skills were preferred and all recommendations were checked against source,
tests, and runtime evidence.

## Remaining release actions

1. Apply and verify the Supabase migration in the target project.
2. Run the authenticated multi-device library merge/logout matrix.
3. Expand the sitemap from static public routes to bounded, source-backed
   dynamic catalog URLs if those pages are part of the intended crawl surface.
4. Run Lighthouse/real-device traces and inspect field Web Vitals after deploy.
