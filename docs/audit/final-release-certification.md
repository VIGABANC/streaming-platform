# VEYRA Final Real-User Release Certification

**Certification date:** 2026-09-15  
**Branch:** `fix/release-readiness-blockers`  
**Source SHA:** `325810fbc4ea34251ff7774b0e17c3dfb1379482`  
**Preview deployment:** `https://streaming-platform-278xggz1d-zahidossama2-1958s-projects.vercel.app`  
**Deployment identity:** GitHub Preview deployment `6455323793` reports `success` and is tied to the source SHA.  
**Vercel API:** `VERCEL_API_INSPECTION_BLOCKED_BY_AUTH` (connector HTTP 403).

## Phase 4 scope normalization

Phase 4 rechecked PR #31 at
`c3ff78f208f38aeaecc5073e0708d852b31a28ff` against merge base
`1c9918d645fa7b5f2368d8bb31cf512f9a2cd576`. At that point the PR was open,
cleanly mergeable, and broad: 213 changed files and 40 commits. GitHub Actions
run `34950553769` was green on the exact SHA, and GitHub deployment
`6455398972` reported Preview success for the exact SHA at
`https://streaming-platform-j4myw7p4u-zahidossama2-1958s-projects.vercel.app`.

The release-scope review confirmed that the product, test, CI, Supabase,
security, and release-documentation changes are part of the final candidate,
but found two normalization issues. First, `/audit` exposed an internal audit
page. A regression test now requires `/audit` to redirect to `/`; it failed
before the fix and passed after removing `app/audit/page.tsx` and restoring the
permanent redirect in `next.config.mjs`. Second, added internal process
artifacts under `.superpowers/sdd/**`, selected `docs/superpowers/**`, and
`docs/audit/veyra-skill-plugin-ledger.md` were removed from the release
candidate because they are not product functionality, required tests,
deployment configuration, database migrations, security configuration, or
release-facing evidence.

## Automated certification

| Check | Result |
|---|---|
| Clean install (`npm ci`) | VERIFIED — 502 packages, 0 vulnerabilities |
| Node / npm | Node v24.18.0 / npm 11.16.0 |
| Typecheck | VERIFIED |
| Lint | VERIFIED |
| Unit tests | VERIFIED — 34 files, 162/162 tests |
| Production build | VERIFIED — 29 static pages generated |
| Production audit | VERIFIED — 0 vulnerabilities |
| Deterministic E2E | VERIFIED — 66/66 Chromium and 66/66 Mobile Chrome |
| Default live smoke | VERIFIED_WITH_LIMITATION — 2 opt-in tests skipped by design |
| GitHub Actions run 10 | VERIFIED — run `34950093600`, exact source SHA, `success` |

## Real-browser acceptance

The final Preview was opened in the in-app browser and inspected as a real
user. Home navigation reached Browse, a featured title detail page, and its
watch route. The watch shell exposed truthful unavailable messaging, no
playback iframe, theater mode, and recovery controls. Returning through browser
navigation preserved the application shell.

The final Preview settings page accepted `MANUAL — Preferred Server` and kept
the selection after reload. The final Preview anime detail route rendered one
safe JSON-LD `TVSeries` object, one heading, the canonical URL, and no iframe.
The final Preview movie watch route rendered `No verified provider is
configured for this media type.` with zero iframes.

| Surface | Result | Evidence / limitation |
|---|---|---|
| Home, Browse, Movies, TV, Anime | VERIFIED | Preview navigation and local deterministic suites |
| Movie detail and watch | VERIFIED_WITH_LIMITATION | Shell and unavailable state verified; opaque playback unavailable |
| TV detail, season, episode, next episode | VERIFIED_WITH_LIMITATION | Route and episode controls verified; playback unavailable |
| Anime detail, episode, next episode | VERIFIED_WITH_LIMITATION | Detail metadata and unavailable episode state verified; no approved provider |
| Search, filters, Back navigation, URL state | VERIFIED | Deterministic desktop/mobile E2E |
| Anonymous favorites, watchlist, history, reload | VERIFIED | Local browser E2E |
| Authenticated merge and cross-device library | MANUAL_ACTION_REQUIRED | Requires a disposable authorized test account |
| Player retry, timeout, failover, exhausted, offline/reconnect | VERIFIED | Deterministic state-machine and browser tests |
| Theater, lights-off, fullscreen shell, keyboard | VERIFIED | Desktop/mobile E2E and Preview inspection |
| Desktop 1440x900 / 1280x720 | VERIFIED_WITH_LIMITATION | Local responsive coverage; protected Preview connector cannot set exact height |
| Tablet 768x1024 | VERIFIED_WITH_LIMITATION | Local responsive coverage; exact protected Preview viewport unavailable |
| Mobile 390x844 / 360x800 | VERIFIED_WITH_LIMITATION | Mobile Chrome and responsive width coverage; exact protected Preview viewport unavailable |

No Preview console warnings or errors were captured. The local production
server emitted recurring `destination stream closed early` diagnostics during
concurrent streamed-shell E2E requests; all associated browser assertions
passed and no browser console failure was observed. Search failure tests also
emit controlled, redacted upstream-auth telemetry by design.

## Accessibility and UI

Keyboard navigation, skip links, named landmarks, focus return, dialog focus
containment, Escape handling, mobile navigation, reduced-motion behavior,
touch-target sizing, player controls, and unavailable status announcements are
**VERIFIED** by browser tests and Preview inspection. Screen-reader software,
forced colors, 200% zoom, and provider-owned iframe controls remain
**EXTERNAL_LIMITATION** because those environments and cross-origin DOM are not
available to this run.

The dark cinematic hierarchy, responsive rails, loading/error/empty states,
and player recovery shell were visually inspected without a confirmed
VEYRA-controlled layout defect.

## SEO, PWA, performance, and security

- Representative movie, TV, anime, provider, genre, person, and 404 routes
  expose titles, descriptions, canonicals, and valid route shells. Movie, TV,
  and anime detail JSON-LD is safe-serialized; hostile-string unit coverage
  passes. Robots and sitemap routes are covered by the existing suite.
- Manifest, offline route, service-worker assets, cache behavior, offline
  refresh, and reconnect behavior are **VERIFIED_WITH_LIMITATION** by local
  production-context tests. Browser install/update UI was not independently
  available in the protected Preview session.
- Build, responsive tests, image sizing checks, and route generation are
  **VERIFIED**. A stable Lighthouse/Core Web Vitals baseline was not available
  through the protected Preview, so LCP, CLS, INP, and TTFB are
  **EXTERNAL_LIMITATION**, with no unsupported performance claim made.
- CSP, URL validation, iframe origin validation, safe JSON-LD, RLS grants and
  policies, rate-limited API boundaries, redacted telemetry, and secret scans
  are **VERIFIED**. No service-role key or provider credential was added to
  client code.

## Player and external providers

VEYRA-owned provider selection, manual/automatic ranking, attempt identity,
timeouts, retry, failover, circuit-breaker state, offline/reconnect, theater,
lights-off, fullscreen shell, keyboard controls, and truthful unavailable
states are **VERIFIED**.

All configured external providers remain `unverified` and ineligible. Opaque
third-party playback is **EXTERNAL_LIMITATION** and remains
`LIVE_PROVIDER_PLAYBACK_UNVERIFIED`. An iframe load is never promoted to
playback success; quality, subtitles, audio, bitrate, and completion are not
claimed.

## Remaining release items

- `FM-01` is **BROWSER_VERIFIED after Phase 4 normalization**: the public audit
  route was removed, the redirect regression passes, and internal process
  artifacts were removed from the candidate. The PR remains broad and still
  requires independent maintainer approval before merge.
- Authenticated library merge/cross-device acceptance requires a disposable
  test account and is `MANUAL_ACTION_REQUIRED`.
- Exact protected Preview viewport heights, screen-reader/forced-colors/zoom
  inspection, and Lighthouse metrics remain `EXTERNAL_LIMITATION`.
- Vercel connector inspection remains
  `VERCEL_API_INSPECTION_BLOCKED_BY_AUTH`; GitHub deployment metadata and
  browser verification are available.

No Critical or High VEYRA-controlled application issue was found in this
acceptance run. No merge or production deployment has been performed for this
certification SHA.
