# VEYRA Browser User Journey Report

Date: 2026-10-02. Browser method: Playwright launched Microsoft Edge (`channel: 'msedge'`) headless at 1440×900, plus a 390×844 mobile context. No application code was changed and no commit was made for this QA run.

## 1. Environment

```text
TMDB_API_KEY set locally: True (value not printed)
CONSUMET_BASE_URL: unset
Dev server: http://localhost:3000
Homepage: HTTP 200
```

Evidence: [browser-evidence.json](docs/screenshots/browser/browser-evidence.json).

## 2. Screenshots and journeys

The browser run created 45 PNG screenshots under `docs/screenshots/browser/`, including all numbered journey states, navigation states, mobile states, API states, error states, and the keyboard focus state.

### Movie discovery

- [00-home.png](docs/screenshots/browser/00-home.png), [01-home.png](docs/screenshots/browser/01-home.png), [02-movies.png](docs/screenshots/browser/02-movies.png), [03-movie-card.png](docs/screenshots/browser/03-movie-card.png)
- [04-movie-550-detail.png](docs/screenshots/browser/04-movie-550-detail.png) shows Fight Club, poster, 1999, 2h 19m, 8.4 rating, synopsis, cast, and “Play Movie”.
- [05-watch-movie-550.png](docs/screenshots/browser/05-watch-movie-550.png) and [06-watch-movie-550-after-load.png](docs/screenshots/browser/06-watch-movie-550-after-load.png) show the same final state after waiting: `No verified provider is configured for this media type`, `Playback: Unavailable`, and `Stream Unavailable on This Server`.

Classification: **UNAVAILABLE**, not PLAYING. No iframe/player rendered in the browser. The reason is that the current playback resolver requires a verified provider, while the live embed check only proves 2embed’s document contains player markup.

### Search

- [07-search-open.png](docs/screenshots/browser/07-search-open.png)
- [08-search-results.png](docs/screenshots/browser/08-search-results.png)
- [09-search-click-detail.png](docs/screenshots/browser/09-search-click-detail.png)
- [10-search-empty.png](docs/screenshots/browser/10-search-empty.png)

The Fight Club API result contains movie id 550. The `zzzzzz` screen is **not an empty state**: it displays `All Results (1)` and `Zzzzzzz`. This is a P1 data-quality issue for the requested empty-search journey.

Representative real-click evidence is in [click-evidence.json](docs/screenshots/browser/click-evidence.json). Home → Movies → Fight Club → Play and Home → Series → Game of Thrones → S1E1 succeeded. On the landing homepage, the requested search-button click did not expose a search input or navigate; the subsequent `click-04-search-open.png` and `click-05-search-results.png` remained on `/` with the landing content. The direct `/search` route works, but the homepage search affordance is not verified as functional.

### TV journey

- [11-tv-catalog.png](docs/screenshots/browser/11-tv-catalog.png)
- [12-tv-1399-detail.png](docs/screenshots/browser/12-tv-1399-detail.png) shows Game of Thrones with 8 seasons, 73 episodes, and Season 1 episodes.
- [13-watch-tv-1399-1-1.png](docs/screenshots/browser/13-watch-tv-1399-1-1.png), [14-watch-tv-after-load.png](docs/screenshots/browser/14-watch-tv-after-load.png) show the same unavailable player state as the movie journey.
- [15-episode-drawer.png](docs/screenshots/browser/15-episode-drawer.png)

The detail page visibly contains Season 1 and the 10-episode list. The watch page did not render a playable iframe.

### Anime honest state

- [16-anime-catalog.png](docs/screenshots/browser/16-anime-catalog.png)
- [17-anime-52991-detail.png](docs/screenshots/browser/17-anime-52991-detail.png) shows Sousou no Frieren and `28 episodes`.
- [18-anime-watch-state.png](docs/screenshots/browser/18-anime-watch-state.png) states `Playback unavailable for this media type` and `VEYRA has no verified anime episode provider. No iframe or playback claim is presented.`

Classification: **HONEST UNAVAILABLE**. No false playback-available claim was observed.

### Navigation

Screenshots exist for all requested main-nav destinations: `nav-home`, `nav-movies`, `nav-tv`, `nav-anime`, `nav-new`, `nav-top10`, `nav-discover`, `nav-watchlist`, `nav-favorites`, `nav-history`, and `nav-profile-settings`. Each loaded a page title and non-blank VEYRA shell in the browser.

### Mobile

- [19-mobile-home.png](docs/screenshots/browser/19-mobile-home.png)
- [20-mobile-movie-detail.png](docs/screenshots/browser/20-mobile-movie-detail.png)
- [21-mobile-watch-movie.png](docs/screenshots/browser/21-mobile-watch-movie.png)
- [22-mobile-anime-detail.png](docs/screenshots/browser/22-mobile-anime-detail.png)

### Error states

Screenshots [23-error-invalid-movie.png](docs/screenshots/browser/23-error-invalid-movie.png), [24-error-404-movie.png](docs/screenshots/browser/24-error-404-movie.png), [25-error-invalid-episode.png](docs/screenshots/browser/25-error-invalid-episode.png), [26-error-404-tv.png](docs/screenshots/browser/26-error-404-tv.png), and [27-error-404-generic.png](docs/screenshots/browser/27-error-404-generic.png) all rendered VEYRA-owned layouts rather than blank pages. The generic unknown route shows `404 — Frequency Lost`, `Page Not Found`, `Go to Home`, and `Search Catalog`.

### Dev fixture

[32-dev-fixture-paused.png](docs/screenshots/browser/32-dev-fixture-paused.png) shows the VEYRA 404 page. The fixture is not available in this runtime and was not exercised as a native player.

## 3. API sweep from browser

All four direct browser API requests returned JSON and status 200:

```text
/api/health/providers: status 200, browser request 68ms, application/json
/api/search?q=fight+club: status 200, browser request 293ms, application/json; result id 550 present
/api/tv/1399/season/1: status 200, browser request 41ms, application/json; episodes array present
/api/player/preference: status 200, browser request 41ms, application/json; {"providerId":null}
```

Screenshots: [28-api-health.png](docs/screenshots/browser/28-api-health.png), [29-api-search.png](docs/screenshots/browser/29-api-search.png), [30-api-tv-season.png](docs/screenshots/browser/30-api-tv-season.png), [31-api-preference.png](docs/screenshots/browser/31-api-preference.png).

## 4. Console and network evidence

Raw evidence is in [browser-evidence.json](docs/screenshots/browser/browser-evidence.json).

Observed browser console messages:

- Repeated development-only `eval() is not supported in this environment` messages from React/Next development tooling under the restrictive CSP. This was not observed as an application crash.
- A React hydration mismatch warning involving `caret-color` on search inputs.
- LCP image warnings from Next Image on Anime and Top 10 pages.
- Expected 404 resource responses for `/this-does-not-exist` and `/watch/dev-fixture`.

Failed network responses captured: only the expected 404 responses for the unknown route and dev fixture. No browser 5xx response was captured in the tested journeys.

## 5. Accessibility

[37-a11y-focus-ring.png](docs/screenshots/browser/37-a11y-focus-ring.png) captures the keyboard focus state after five Tab presses. A full Lighthouse accessibility score was not run in this automated browser pass; no score is claimed.

## 6. Accessibility and performance

Lighthouse was run against Microsoft Edge using `CHROME_PATH` because Chrome was not installed. Lighthouse wrote both JSON reports; its final Windows temp-directory cleanup returned `EPERM` after the reports were written.

Raw reports: [lighthouse-home.json](docs/screenshots/browser/lighthouse-home.json), [lighthouse-watch.json](docs/screenshots/browser/lighthouse-watch.json), and [lighthouse-anime.json](docs/screenshots/browser/lighthouse-anime.json).

| URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 0.34 | 0.91 | 0.92 | 1.00 | 11.1s | 0 | 13,200ms |
| `/watch/movie/550` | 0.58 | 0.96 | 0.92 | 0.69 | 9.9s | 0 | 640ms |
| `/anime/52991` | 0.63 | 0.96 | 0.92 | 1.00 | 8.7s | 0 | 470ms |

The scores are raw Lighthouse values from the JSON reports, not pass/fail claims. The home page has a severe performance/TBT finding; the watch page has slow LCP and reduced SEO score.

## 7. Working register — actual browser playback

| Content Type | Title | ID | Provider | Screenshot | Notes |
|---|---|---:|---|---|---|
| Movies | Fight Club | 550 | None | [05-watch-movie-550.png](docs/screenshots/browser/05-watch-movie-550.png) | Browser showed `No verified provider is configured`; no player rendered |
| TV | Game of Thrones S1E1 | 1399 / 1 / 1 | None | [13-watch-tv-1399-1-1.png](docs/screenshots/browser/13-watch-tv-1399-1-1.png) | Browser showed unavailable state; no player rendered |
| Anime | Frieren E1 | 52991 / 1 | None | [18-anime-watch-state.png](docs/screenshots/browser/18-anime-watch-state.png) | Intentionally unavailable because Consumet is unset |

Therefore: **Movies: no provider rendered a playable player in browser. TV: no provider rendered a playable player in browser. Anime: intentionally unavailable.** The earlier 2embed result is embed-document markup evidence, not browser playback evidence.

## 8. Problem register

| ID | Severity | Area | Symptom | Evidence | Likely cause |
|---|---|---|---|---|---|
| BROWSER-P0-1 | P0 | Movie/TV playback | Watch pages show `No verified provider is configured` and no iframe despite 2embed health being healthy | [05-watch-movie-550.png](docs/screenshots/browser/05-watch-movie-550.png), [13-watch-tv-1399-1-1.png](docs/screenshots/browser/13-watch-tv-1399-1-1.png) | Playback resolver rejects unverified providers; health markup check is not equivalent to authorization/verified playback |
| BROWSER-P1-1 | P1 | Search | `zzzzzz` returns one `Zzzzzzz` result instead of empty state | [10-search-empty.png](docs/screenshots/browser/10-search-empty.png) | TMDB fuzzy search returns a weak match and UI does not suppress it |
| BROWSER-P1-2 | P1 | Search navigation | Homepage search click did not open the search interaction or navigate to `/search` | [click-04-search-open.png](docs/screenshots/browser/click-04-search-open.png), [click-05-search-results.png](docs/screenshots/browser/click-05-search-results.png) | Landing search affordance differs from the shared header route and was not activated by the tested accessible-name click |
| BROWSER-P2-1 | P2 | Browser console | Repeated development `eval()` CSP messages | [browser-evidence.json](docs/screenshots/browser/browser-evidence.json) | Next/React development tooling requires eval; production impact unverified |
| BROWSER-P2-2 | P2 | Hydration | Search input caret style differs between server and client | [browser-evidence.json](docs/screenshots/browser/browser-evidence.json) | Client-only search interaction state differs during hydration |
| BROWSER-P2-3 | P2 | Performance hint | Next Image logs LCP loading advisories | [browser-evidence.json](docs/screenshots/browser/browser-evidence.json) | Above-fold images are not marked eager |

## 9. Not verified

- Manual Lighthouse review beyond automated audits, including keyboard semantics not covered by automated scoring.
- Real click-through to an iframe play button, because the application rendered the unavailable state before an iframe existed.
- Episode drawer S1E2 source swap beyond the captured static watch state.
- Consumet anime playback because `CONSUMET_BASE_URL` is unset.
- Production-mode behavior beyond the observed dev fixture 404.

## 10. Verdict

**Not shippable for playback — the browser verified metadata and honest anime unavailability, but no movie or TV provider rendered a playable player.** Metadata routes are operational; the application currently needs a verified playback-provider integration before claiming movie/TV playback.

## 2026-10-27 current-head addendum

Current optimized-build results: the full journey suite passed 117/117 desktop and 117/117 mobile before the dependency patch; the current post-fix tree passed 55/55 desktop and 55/55 mobile route/content matrix cases. The route matrix covered 10 movie IDs, 10 anime IDs, five malformed/unknown routes, console/5xx checks, and axe serious/critical checks. BUG-011 contrast failures are fixed. BUG-013 dependency findings are fixed; `npm audit --omit=dev --audit-level=high` reports 0 vulnerabilities. External provider playback, real authentication, and deployment runtime remain unknown rather than verified.

## 2026-10-27 current repair pass

The live headed-browser follow-up on `/watch/movie/550` confirms the current
boundary precisely: VEYRA renders the registry-selected 2Embed document as an
opaque external frame, while every exposed server is visibly labeled
`UNVERIFIED`. The shell reports `Playback: Provider controlled` and exposes the
accessible explanation `A frame load does not verify playback`; this is frame
document evidence only, not verified media playback. No provider was promoted
to an authorized or independently verified playback integration.
The opaque document also exposed a provider-owned advertising link in its nested
document; it was recorded as evidence and not clicked.

- Root cause reproduced: headed development browser hydration mismatch on `/watch/movie/550` when persisted provider-health ranking reordered providers during the first client render.
- Fix: `PlayerFrame` now hydrates persisted provider health in an effect and passes a caller-owned snapshot to the resolver; server/client first-render ordering is deterministic.
- Regression coverage: `tests/e2e/player.spec.ts` seeded reordered provider health and asserted no hydration error; the resolver has an explicit-snapshot unit test.
- Fresh gates after the fix: typecheck PASS, lint PASS, Vitest 38 files/176 tests PASS, production build PASS, `npm audit --omit=dev --audit-level=high` PASS with 0 vulnerabilities, deterministic E2E Chromium 125/125 PASS, Mobile Chrome 125/125 PASS.
- Search P1 revalidation: the live `/api/search?query=zzzzzz` response returned an empty visible `results` array after low-signal repeated-character filtering, and a fresh production-server Chromium run passed all 7 search-flow tests, including landing navigation to `/search`.
- The clean production E2E server was started by the test runner after the identified stale listener was stopped; the first contaminated run is excluded from pass totals.
- A separate development-server search run was invalidated by slow HMR/upstream failure behavior and is not counted as release evidence; the clean production-server rerun is authoritative for these search flows.
- External limitations remain unchanged: no authorized provider playback, real Supabase auth-account isolation, protected Preview exact-viewport smoke, Vercel API inspection, or provider-owned iframe verification.
