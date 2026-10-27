# VEYRA Test Plan

## Method

Test the local production build as a real user would: navigate route by route, inspect visible landmarks and states, watch for blank/error shells, capture console and HTTP 5xx failures, and run axe against the host document. Third-party iframe internals are excluded from axe because they are outside the application boundary.

## High-priority cases

| ID | Journey | Expected result | Result |
| --- | --- | --- | --- |
| F01 | Public route matrix | 30 public routes render one healthy main shell | Pass |
| F02 | Search | Search and finder controls are present and usable on first visit | Pass |
| F03 | Movie detail matrix | 10 movie IDs render detail or explicit unavailable state | Pass |
| F04 | Movie watch | Host player shell renders without host errors | Pass |
| F05 | TV watch | Episode player shell and controls render; iframe boundary is isolated | Pass |
| F06 | Anime detail matrix | 10 anime IDs render truthful metadata/playback-unavailable state with no iframe | Pass |
| F07 | Anime watch | Unverified playback is refused explicitly; no iframe is presented | Pass |
| F08 | Library/account | Empty states, settings, auth, profile and offline surfaces render | Pass |
| F09 | Responsive route smoke | Existing Chromium mobile project covers core user journeys | Pass |

## Edge and quality checks

- Reduced motion landing behavior.
- External catalog failure and Jikan timeout fallback.
- CSP poster origin coverage for anime artwork.
- Console error and HTTP 5xx capture.
- Serious/critical axe violations on every matrix route.
- TypeScript, ESLint, unit tests, production build, and E2E suite.

## 2026-10-27 executed results

Commands: `npm test -- --run`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm audit --omit=dev --audit-level=high`, `npm run test:e2e -- --project=chromium`, `npm run test:e2e -- --project="Mobile Chrome"`, and the route matrix in both projects.

- Vitest: 38 files, 176 passed.
- Full Playwright journey suite: 125/125 Chromium and 125/125 Mobile Chrome on the clean post-repair production server.
- Route/content matrix: 55/55 desktop and 55/55 mobile, including 10 movies, 10 anime IDs, invalid routes, console/5xx gates, and axe serious/critical gates.
- Typecheck, lint, build: passed. Build logged a caught external Jikan timeout and rendered fallback content.
- Dependency audit: 0 vulnerabilities after upgrading Next to 16.4.3 and running non-force `npm audit fix`.
- Real auth, deployment protection, external iframe internals, and verified provider playback remain untested.

The headed browser also reproduced and then covered BUG-014, a provider-health hydration mismatch. A stale-listener-contaminated run was discarded; the clean rerun stopped the identified listener and started a fresh production server. A live headed follow-up confirmed that the movie route may render an opaque external provider document, but all exposed providers remain visibly `UNVERIFIED`; the shell does not claim that frame load equals playback verification.

## Matrix IDs

Anime IDs: `1, 20, 21, 1535, 1575, 5114, 9253, 11061, 16498, 30276`.

Movie IDs: `550, 603, 27205, 157336, 278, 13, 238, 680, 497, 155`.
