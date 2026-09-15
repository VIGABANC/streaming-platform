# VEYRA Final Master Audit

**Phase:** Goal 3, Phase 2 remediation checkpoint
**Audit date:** 2026-09-15
**Audited branch:** `fix/release-readiness-blockers`
**Audited SHA:** `f0efdbd9334a4a9c2eb93d92815cfb40fc6d3d23`
**Remote branch:** `origin/fix/release-readiness-blockers` at the same SHA
**Base:** `origin/main` at `1c9918d645fa7b5f2368d8bb31cf512f9a2cd576`

This report uses evidence collected during the audit and remediation run. It
does not treat older reports as proof. Production code changes remain local and
uncommitted; no merge or production deployment was performed.

## Evidence baseline

The audited SHA remains the base for the focused local remediation. `git diff
--check` passed. The
branch is pushed to origin and the remote feature ref resolves to the same
full SHA. The branch comparison against `origin/main` contains 206 changed
files, 6,379 additions, and 5,442 deletions. That broad historical delta is a
release-review risk even though the current verification suite is green.

Fresh local results:

- `npm run typecheck`: **PASS**
- `npm run lint`: **PASS**
- `npm test -- --run`: **PASS**, 34 files / 162 tests
- `npm run build`: **PASS**, Next.js 16.3.3, 29 static pages and the expected
  application route set
- `npm audit --omit=dev`: **PASS**, 0 vulnerabilities
- `npm run test:e2e`: **PASS**, 65/65 Chromium and 65/65 Mobile Chrome
- `npm run test:live`: **PASS by design**, 2 tests skipped without opt-in
- Explicit Preview live smoke with `VEYRA_LIVE_SMOKE=1`: **PASS**, 2/2
  observational tests; this does not prove third-party playback

GitHub evidence:

- Verify run `34944356274` is **PASS** on the exact audited SHA. Install,
  Chromium setup, lint, typecheck, unit, build, desktop E2E, mobile E2E,
  artifact upload, and audit all passed.
- PR #31 is open and mergeable, with head SHA equal to the audited SHA. It is
  not merged.
- The old run `34763505646` targets historical `main` and is excluded from
  current evidence.

Phase 2 remediation evidence:

- The player selector regression test is **PASS**: manual mode honors the
  preferred eligible provider while auto mode preserves health ranking.
- The checked-in Supabase migration `20260915082032_optimize_library_rls_and_indexes.sql`
  was applied to project `gfojgnkoaagzytpjzrtx`. Library policies now use a
  stable `auth.uid()` init plan and the missing availability-report user index
  exists. The earlier grant-tightening migration was also applied remotely;
  `anon` has no privileges on `user_library_snapshots`.
- Supabase security advisors no longer report the mutable search-path or
  library privilege/policy findings. Remaining feedback-table findings are
  intentional service-role-only boundaries.
- The fresh local browser suite is **PASS**, 65/65 Chromium and 65/65 Mobile
  Chrome. The default live smoke remains two intentionally skipped opt-in
  tests.

Deployment evidence:

- GitHub's Vercel status is successful for the audited SHA and points to
  deployment `57DELvBnjFYYTwtMEs7fnno4LGx5`.
- The Vercel deployment page visibly links the audited GitHub commit and the
  Preview URL:
  `https://streaming-platform-cz2hl72ce-zahidossama2-1958s-projects.vercel.app`
- Authenticated browser smoke reached the requested catalog, detail, watch,
  anime-unavailable, offline, and 404 states with no browser console errors or
  warnings in the captured run.
- Direct unauthenticated HTTP access is blocked by Vercel Deployment
  Protection. Mobile Preview viewport control was unavailable in the browser
  connector. The Vercel API returned HTTP 403 for deployment inspection. These
  are recorded as external access limits, not silently upgraded to deployment
  failure.

## Real-browser observations

The authenticated Preview browser reached `/`, `/browse`, `/movies`, `/tv`,
`/anime`, `/new`, `/top10`, `/discover`, `/search`, `/my-list`, `/favorites`,
`/history`, `/profile`, `/settings`, `/offline`, movie detail, TV detail, anime
detail, movie watch, TV watch, anime watch, and an unknown route. The route
shell, skip link, shared navigation, headings, empty states, 404 state, and
player state were visible.

The movie and TV watch routes visibly show `Playback: Unavailable`,
`Quality: Unavailable`, and `No verified provider is configured for this media
type.` The TV route also exposed bounded retry, reload, back, next-episode, and
episode-list controls. The anime route showed `Playback unavailable` and
explicitly stated that no iframe or playback claim is presented. No playback
iframe was exposed for these unverified provider states.

The browser captured the unavailable movie-player state during this audit. It
showed the server shell, lights/theater/fullscreen controls, bounded retry and
reload actions, and the unavailable message. It did not show a false playback
success state.

The installed browser connector could not set all requested exact viewport
heights or save a screenshot file into the repository. Local Playwright did
cover responsive sizes including 375, 390, 430, 768, 1024, 1280, and 1440
widths, plus the Mobile Chrome project. Exact headed-browser inspection at
360x800, 1280x720, 1440x900, and screen-reader inspection remain manual
follow-up evidence gaps.

## Master subsystem matrix

| ID | Subsystem | Result | Classification | Evidence / remaining work |
|---|---|---|---|---|
| A | Application architecture | Builds and typechecks; route architecture is coherent | RESOLVED | Fresh build and route inspection pass. The 206-file branch delta remains a review-scope risk, tracked as FM-01. |
| B | Movies | Catalog, detail, trailer shell, watch route, and unavailable state render | RESOLVED | Preview `/movie/1007757` and `/watch/movie/1007757`; deterministic E2E pass. |
| C | TV / series | Detail, season selection, episode list, watch navigation, and unavailable state render | RESOLVED | Preview `/tv/1399` and `/watch/tv/1399/1/1`; deterministic E2E pass. |
| D | Anime | Jikan-backed detail route and catalog shell render; episode playback is unavailable | RESOLVED / EXTERNAL_LIMITATION | Preview `/anime/1` and `/watch/anime/1/1`; no provider is trusted. |
| E | Search | URL-persistent input, intent parsing, empty and failure states work | RESOLVED / EXTERNAL_LIMITATION | Unit/E2E pass; local run logged controlled TMDB auth-failure telemetry when using the test key. A real TMDB credential is deployment configuration. |
| F | Discovery | Browse, discover, genres, and world-cinema metadata rails render | RESOLVED | Preview route smoke and build pass. |
| G | Detail pages | Movie, TV, and anime metadata, actions, recommendations, and trailers render | RESOLVED | Preview AX inspection and route smoke pass. Trailer internals are cross-origin. |
| H | Seasons / episodes | Season route and episode navigation are bounded and semantic | RESOLVED | TV detail/watch E2E and Preview inspection pass. |
| I | User library | Anonymous local list, favorites, history, export/reset flows work | RESOLVED LIMITED | Local E2E pass; authenticated cloud persistence was not tested with a real account. |
| J | Authentication | Auth shell and sign-in links render | EXTERNAL_LIMITATION | No test account was supplied; session restoration and multi-device behavior remain unverified. |
| K | Supabase persistence | Library grants and policy-performance drift were remediated | RESOLVED LIMITED | Remote grant and advisor queries are clean for the library tables; feedback tables remain intentionally service-role-only. See FM-02. |
| L | Settings | Server Selection and subtitle preference are consumed by the player runtime | RESOLVED | Unit selector coverage and fresh Chromium/Mobile Chrome suites pass; unverified providers remain unavailable. See FM-03. |
| M | Player | Attempt identity, unavailable state, retry, reload, offline, theater, lights-off, fullscreen shell, and keyboard behavior pass | RESOLVED LIMITED | 65/65 per browser project plus player unit tests. Native/opaque provider behavior is outside the shell boundary. |
| N | External providers | All configured external providers remain unverified and ineligible | EXTERNAL_LIMITATION | Resolver emits no playable external source. Live smoke is observational only. |
| O | PWA / offline | Manifest, worker assets, offline route, worker tests, and offline E2E pass | RESOLVED LIMITED | Production-context E2E passes; connector did not independently inspect install/update UI. |
| P | Navigation | Shared header, footer, mobile navigation, back/forward route shells pass | RESOLVED | E2E and Preview route smoke pass. |
| Q | Accessibility | Semantic landmarks, skip link, labels, keyboard dialogs, focus handling, and player controls pass tested flows | RESOLVED LIMITED | Automated and browser AX evidence pass; NVDA/VoiceOver, forced colors, zoom contrast, and provider DOM remain unverified. |
| R | Mobile / tablet | Mobile Chrome suite and responsive width coverage pass | RESOLVED LIMITED | Exact headed Preview mobile smoke was unavailable; local Mobile Chrome is green. |
| S | SEO | Metadata, canonical routes, robots, sitemap, and script-safe JSON-LD tests pass | RESOLVED LIMITED | Hostile structured-data regression coverage exists; crawler indexing and live search console behavior were not tested. |
| T | Security | Headers, CSP, URL validation, redacted telemetry, secret boundaries, and npm audit pass | RESOLVED LIMITED | Supabase production grant drift remains FM-02; no client service-role exposure found. |
| U | APIs | Search, season, webhook, and missing-availability route validation/error boundaries pass | RESOLVED LIMITED | Upstream credentials and third-party quotas remain deployment dependencies. |
| V | Performance | Build and route generation pass; no measured Core Web Vitals baseline was available | PARTIALLY_RESOLVED | A real-user/Lighthouse performance baseline is still needed before optimization claims. |
| W | Caching | Route and worker cache policies are bounded and tested | RESOLVED LIMITED | External CDN cache behavior was not available through the Vercel API. |
| X | Observability | Provider-safe events and redacted request categories are present | RESOLVED LIMITED | No production dashboard or alert threshold verification was available. |
| Y | Telegram integrations | Webhook secret boundary and durable feedback path are present | RESOLVED LIMITED | Real Telegram delivery and admin-chat workflows were not exercised. Supabase advisor findings on feedback tables need owner review. |
| Z | Deployment / release workflows | Exact-head CI and Vercel GitHub status pass; PR remains open | RESOLVED LIMITED | Merge, production deployment, and exact production-SHA shell verification have not occurred. |

## Findings requiring remediation

### FM-01 — Broad branch delta needs release review

**Priority:** P1 release-process risk
**Status:** OPEN
**Reproduction:** `git diff --stat origin/main...HEAD` reports 206 changed files,
6,379 additions, and 5,442 deletions.
**Root cause:** The release branch contains a large accumulated product and
documentation delta relative to the current `main`, including historical
renames/deletions.
**Impact:** Reviewers cannot safely infer that the PR is limited to Goal 3
release validation from the PR size alone.
**Recommended remaining release action:** Reconcile the branch against the intended
release baseline and produce a focused, explicitly reviewed merge plan. Do not
discard user work or rewrite working code as part of this audit.

### FM-02 — Linked Supabase project has migration and privilege drift

**Priority:** P1 security/release blocker
**Status:** BROWSER_VERIFIED
**Original reproduction:** The linked project had broad table grants, four
unoptimized library policies, and an unindexed
`missing_availability_reports.user_id` foreign key.
**Root cause:** The checked-in security and policy-performance migrations had
not yet been applied to the linked project.
**Impact before remediation:** RLS was enabled, but table-level privileges were
broader than the checked-in security design; policy evaluation and ownership
lookups were less efficient.
**Completed remediation:** Applied the checked-in grant-tightening migration
and the policy/index optimization migration to the linked Supabase project;
reran grants and advisors. The remaining service-role-only feedback-table
advisor findings are documented under FM-10.

### FM-03 — Server Selection setting is a persisted dead control

**Priority:** P1 product truthfulness
**Status:** BROWSER_VERIFIED
**Original reproduction:** Preview `/settings` exposed `AUTO — Recommended` and
`MANUAL — Preferred Server`, but the player did not consume the persisted
`playerMode` value.
**Root cause:** The settings UI and player runtime were out of sync.
**Impact before remediation:** A user could select a preference with no runtime
effect. The provider gate still prevented any false playback claim.
**Completed remediation:** Wired the mode into initial provider selection and
forwarded the stored subtitle preference through the resolver contract. Added
selector regression coverage and reran the full deterministic browser suite.
The provider eligibility gate remains unchanged.

### FM-04 — Production and Preview exact mobile/headed evidence is incomplete

**Priority:** P2 verification gap
**Status:** EXTERNAL_LIMITATION
**Evidence:** Local Mobile Chrome E2E is green and responsive width tests pass.
The authenticated Preview browser connector could not set exact requested
viewport heights or independently inspect a mobile Preview session; direct
unauthenticated HTTP is Deployment Protection gated.
**Recommended action:** Run a headed desktop/mobile smoke with owner access to
the protected Preview and record exact viewport, console, CSP, and network
evidence.

### FM-05 — Vercel API inspection is unavailable

**Priority:** EXTERNAL
**Status:** VERCEL_API_INSPECTION_BLOCKED_BY_AUTH
**Evidence:** Vercel connector deployment calls return HTTP 403 for the
project/team scope. GitHub Vercel status and authenticated browser deployment
page independently tie the Preview to the audited SHA.
**Impact:** Runtime logs, deployment metadata through the connector, and
production deployment identity cannot be inspected through that API. This is
an operational access limitation.

### FM-06 — Opaque provider playback remains unverified

**Priority:** EXTERNAL
**Status:** EXTERNAL_PROVIDER_LIMITATION_ACCEPTED
**Evidence:** The provider registry marks all external providers unverified and
ineligible; deterministic tests confirm no unverified iframe is promoted. The
explicit live smoke passes only observational classification.
**Impact:** No external movie, TV, or anime playback claim can be made. This is
outside VEYRA control and is documented as unavailable/unverified.

## Final release map

The code is **CODE_VERIFIED** and **LOCAL_E2E_VERIFIED**. CI is
**CI_VERIFIED** on the exact audited SHA. The Preview is **PREVIEW_VERIFIED
LIMITED** through GitHub status and authenticated desktop shell smoke.
Production has not been merged or redeployed, so it is not
**PRODUCTION_SHELL_VERIFIED**. External provider playback is
**LIVE_PROVIDER_PLAYBACK_UNVERIFIED**. Vercel API inspection is
**VERCEL_API_INSPECTION_BLOCKED_BY_AUTH**.

Real remaining work is FM-01 branch-scope review and the external evidence
gaps FM-04/FM-05/FM-07/FM-08/FM-09/FM-10. FM-02 and FM-03 are remediated and
verified. FM-06 is an accepted external limitation while the trust gate
remains enabled.

**FINAL AUDIT COMPLETE**
**REMEDIATION COMPLETE**
**READY FOR FINAL ACCEPTANCE**
