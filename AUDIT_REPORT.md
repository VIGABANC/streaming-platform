# VEYRA Streaming Platform Audit

Date: 2026-09-05  
Scope: application source, configuration, build/test checks, local runtime, browser accessibility tree, SEO/PWA/security controls, persistence, and delivery risks.  
Constraint: audit only; no application functionality was changed.

## Executive summary

The codebase is buildable and has a good defensive baseline, but the documented setup cannot boot the application because the Supabase variables required by the global proxy are absent from `.env.example`. With Supabase variables supplied, the shell renders, but invalid/unavailable TMDB data is silently converted into empty rails on the core home, movies, and TV routes. The highest-value release work is therefore reliability and product truth: make required configuration explicit, surface catalog outages, connect account identity to library persistence, and complete or remove the inactive PWA claim.

The audit found 10 actionable findings. Two are release blockers under normal documented setup, three are P1 product/security risks, and five are P2 quality or hardening issues. Existing strengths include passing unit/type/lint/build checks, zero production `npm audit` vulnerabilities, server-side TMDB key usage, restrictive image hosts, security headers, skip navigation, and several good loading/error states.

## Findings

### F-01 — Required Supabase configuration is missing from the documented environment

- Severity: P1 / deployment blocker
- Confidence: High
- Complexity: S
- Evidence: `proxy.ts:4-8` matches nearly every request and calls `lib/supabase/proxy.ts:6-7`, which non-null-asserts `NEXT_PUBLIC_SUPABASE_URL` and a publishable/anon key. `.env.example:1-8` contains TMDB and embed settings but no Supabase variables.
- Reproduction: `npm run dev` with no Supabase variables; browser navigation to `/` shows the Supabase “URL and Key are required” runtime overlay and the server logs the failure from `updateSession`.
- Impact: the global proxy prevents the application shell and all matched routes from rendering in a default documented setup. The failure also affects metadata routes because the matcher is broad.
- Recommendation: add clearly named Supabase variables to `.env.example`, fail fast with an actionable configuration page/message, and make the proxy’s configuration path explicit. Never place privileged keys in public variables.

### F-02 — Core catalog failures are swallowed and rendered as an empty product

- Severity: P1 / reliability
- Confidence: High
- Complexity: M
- Evidence: `app/page.tsx:10-12`, `app/movies/page.tsx:28-38`, and `app/tv/page.tsx:28-38` catch catalog errors and return `[]`. The home route then renders rails from empty arrays without an outage state.
- Reproduction: run with valid Supabase placeholders and an invalid TMDB key. `/` returns 200 and the browser shows the navigation shell but no catalog content; `/discover` instead exposes “Could not load titles,” demonstrating inconsistent recovery behavior.
- Impact: users cannot distinguish “no titles” from a TMDB outage, expired key, network failure, or upstream rate limit. This damages trust and makes support diagnosis difficult.
- Recommendation: preserve an explicit failure state per feed or page, distinguish partial from total failure, include retry guidance, and log a correlation-safe error code without exposing provider details.

### F-03 — Authentication and library persistence are disconnected

- Severity: P1 / product integrity
- Confidence: High
- Complexity: L
- Evidence: login copy promises “Sync your library across every screen” (`app/auth/login/page.tsx:22`), while `lib/store.ts` is localStorage-backed and the repository contains no Supabase table/query layer for watchlist, favorites, ratings, history, or profile. The project’s own audit surface labels `/my-list` “Not account-synced.”
- Impact: signing in does not make the primary library follow the account or another device; clearing browser storage can remove the user’s library while the UI suggests account-backed persistence.
- Recommendation: either make local-only behavior explicit throughout the auth UX or design a versioned Supabase data model with RLS, migration/conflict rules, sign-out behavior, and local-to-account merge semantics.

### F-04 — PWA/offline behavior is declared but not activated

- Severity: P1 / release-truth issue
- Confidence: High
- Complexity: M
- Evidence: `README.md:15`, `app/layout.tsx:58`, `public/manifest.json`, and `public/sw.js` advertise an installable/offline experience. Source search found no `navigator.serviceWorker.register` or equivalent registration call. The manifest has only SVG/32px/180px icons; no common 192px and 512px raster icons.
- Impact: the service worker never enters the browser lifecycle, so the offline fallback and shell cache are not available. Installability may be degraded or rejected by browser audits.
- Recommendation: register the worker in a client bootstrap with update/error handling, verify scope and cache versioning, add 192px and 512px icons, and test install/offline/update flows. Otherwise remove the offline/install claims.

### F-05 — Settings expose controls that are not wired to behavior

- Severity: P1 / product integrity
- Confidence: High
- Complexity: M
- Evidence: `app/settings/page.tsx:115-172` persists autoplay, default server, and ambient-lighting settings. `PlayerFrame.tsx:54` always initializes `PROVIDERS[0]`; no application code consumes `autoplayNext`, `ambientLighting`, `streamQuality`, or `reducedMotion` outside the store/settings surface.
- Impact: users receive false confirmation that playback behavior changed. In particular, “Default Video Server” does not control the first provider.
- Recommendation: connect each setting to the owning runtime behavior, add integration tests for persistence and reload, or remove controls that are not implemented.

### F-06 — Mobile filter drawer lacks modal accessibility behavior

- Severity: P2 / accessibility
- Confidence: High
- Complexity: S
- Evidence: `components/discover/DiscoverFilters.tsx:277-310` creates a fixed backdrop and sheet without `role="dialog"`, `aria-modal`, an accessible dialog label, Escape handling, focus capture/return, or a focus trap. The icon-only close button at the sheet header has no accessible name.
- Impact: screen-reader users may not understand the drawer context; keyboard users can tab behind it or lose focus when it closes.
- Recommendation: implement the modal dialog pattern: labelled dialog, `aria-modal`, initial focus, trapped focus, Escape/backdrop close, focus return, and an accessible close name.

### F-07 — JSON-LD is inserted without safe script escaping

- Severity: P1 / security-sensitive
- Confidence: Medium
- Complexity: S
- Evidence: `app/movie/[id]/page.tsx:98-121` and `app/tv/[id]/page.tsx:113-137` use `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` with upstream title/overview values. JSON.stringify does not escape `<` or the `</script>` sequence.
- Impact: if an upstream content field ever contains a script-breaking sequence, it can escape the JSON-LD script context and become reflected/stored XSS in detail pages. This is an input-trust boundary, not a demonstrated live exploit against TMDB.
- Recommendation: use a serializer that escapes `<`, `>`, `&`, and U+2028/U+2029 for HTML script contexts, or emit structured data through a framework-safe mechanism. Add a regression test with hostile title/overview content.

### F-08 — Public API hardening is incomplete

- Severity: P2 / security and reliability
- Confidence: High
- Complexity: M
- Evidence: `app/api/search/route.ts:6-23` has length validation but no rate limiting, request throttling, cache policy, or abuse budget; it logs the raw query on failure. `app/api/tv/[id]/season/[season]/route.ts:8-21` uses `parseInt` without strict numeric/range validation and maps all upstream failures to 500 while returning the upstream error code.
- Runtime evidence: `/api/search?query=a` returns 400; with an invalid TMDB key `/api/search?query=ab` returns 502 and the server logs the query; invalid season input returns 400.
- Impact: search can be used as an uncontrolled proxy to consume TMDB quota, logs can retain user-entered search text, and clients receive inconsistent error semantics.
- Recommendation: add rate limiting and bounded caching, avoid raw query logging or redact it, strictly validate IDs/seasons, map known upstream failures to stable public codes, and avoid returning provider internals.

### F-09 — SEO discovery and canonical metadata are incomplete

- Severity: P2 / SEO
- Confidence: High
- Complexity: M
- Evidence: `app/sitemap.ts:6-20` emits only six static URLs, omitting dynamic movie, TV, person, collection, genre, provider, streaming, and browse pages. `app/layout.tsx:5-31` has no `metadataBase` or canonical URL; root metadata also has no default OG/Twitter image. `lastModified` is generated from the current time on every sitemap request.
- Runtime evidence: `/sitemap.xml` returns a valid XML sitemap, but only the static route set and a new timestamp per request.
- Impact: crawlable detail pages are not declared in the sitemap; canonical resolution and social previews are less deterministic, and last-modified signals do not represent content changes.
- Recommendation: define a stable site origin, add canonical metadata where needed, generate dynamic URLs from the supported catalog, and use source/update timestamps rather than request time.

### F-10 — Performance and observability risks are source-level, not yet measured

- Severity: P2 / performance operations
- Confidence: Medium
- Complexity: M
- Evidence: `app/layout.tsx:50-56` loads Google Fonts through an external stylesheet in the document head; `components/landing/CinematicHero.tsx:75-80` requests an `original` backdrop at quality 90 with priority; media-grid/card code prioritizes multiple initial images. Source search found no Web Vitals/RUM/error-capture instrumentation beyond production page analytics.
- Impact: render-blocking font delivery, large hero transfer, and over-prioritized images can delay LCP on constrained networks; without field metrics, regressions and route failures are difficult to detect.
- Recommendation: measure with Lighthouse/trace and field Web Vitals before changing targets, then self-host or use `next/font`, size/priority only the true LCP asset, lazy-load below-fold media, and add privacy-appropriate error/RUM telemetry.

## Positive controls

- `npm test -- --run`: 5 files and 36 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed with Next 16.3.3/Turbopack and generated routes.
- `npm audit --omit=dev`: zero reported production vulnerabilities.
- `next/image` is restricted to `image.tmdb.org`; TMDB access is server-side.
- Baseline headers include CSP, `X-Content-Type-Options`, frame policy, referrer policy, and permissions policy. `/watch/*` intentionally overrides frame policy to `SAMEORIGIN`.
- Shell includes a skip link, a main landmark, mobile navigation current-state metadata, live loading/error regions, and reduced-motion handling in the landing hero.
- Player embed URLs validate positive integer media/season/episode values, and iframe errors/offline/timeout states have recovery UI.

## Verification and limitations

- Playwright E2E baseline: 9 tests attempted, 9 failed during the no-Supabase environment run because the app runtime error prevented the expected shell elements from appearing. This is evidence of the configuration blocker, not a claim that every test fails with production secrets configured.
- Browser checks were performed against a local dev server with placeholder Supabase values and an intentionally invalid TMDB key to exercise failure states. The shell, settings route, discover error state, robots, sitemap, API validation, and security headers were inspected.
- No production credentials, external account writes, database migrations, or application fixes were used. Dependency audit and source analysis do not replace production Lighthouse, load, accessibility-device, or penetration testing.

## Specialist skill ledger

Installed and read outside the repository under `C:\Users\ossam\.codex\audit-skills` after discovery and installer risk review:

| Domain | Skill/source | Use in audit |
|---|---|---|
| React | `vercel-labs/agent-skills@vercel-react-best-practices` | Server/client boundaries, waterfalls, bundle and persistence review |
| Next.js | `wshobson/agents@nextjs-app-router-patterns` | App Router conventions, metadata, route handlers, proxy behavior |
| Frontend design | `anthropics/skills@frontend-design` | Visual hierarchy, responsive and interaction review |
| Accessibility | `addyosmani/web-quality-skills@accessibility` | WCAG, modal, focus, live-region and target-size review |
| SEO | `addyosmani/web-quality-skills@seo` | Sitemap, canonical, structured-data and crawlability review |
| Performance | `addyosmani/web-quality-skills@performance` | Measurement discipline, loading, LCP and RUM review |
| Supabase | `supabase/agent-skills@supabase` | SSR client, env, auth and RLS/persistence review |
| GSAP | `greensock/gsap-skills@gsap-react` | Effect scoping, cleanup, reduced-motion and SSR review |
| Web security | `owasp/secure-agent-playbook@web-security-review` | CSP, iframe, input, output-encoding and API review |
| Playwright | `alinaqi/maggy@playwright-testing` | Role-first browser verification methodology; installer marked high risk, so examples were not executed blindly |
| PWA | `alinaqi/maggy@pwa-development` | Manifest/service-worker/installability checks only; generic recipe limitations noted |

Mandatory discovery searches also covered structured data, route handlers, image performance, Supabase/Postgres, iframe/player safety, PWA, GSAP, SEO, accessibility, and web security. No trustworthy high-signal structured-data specialist was selected; the SEO skill’s structured-data guidance was used instead.
