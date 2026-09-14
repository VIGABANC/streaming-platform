# VEYRA player reliability report

## Before

The player used a fixed first provider, treated iframe `load` as playback
readiness, retried through a modulo-based provider cycle, and scheduled warning
and hard timeout timers in an effect that cleaned up when the warning state
changed. Watch routes also constructed embed URLs independently of the player.

## Root causes addressed

- Strict positive-integer validation now rejects malformed TV route segments.
- Provider ranking uses bounded Bayesian-style reliability, latency, preference,
  and exploration signals, while excluding attempted or cooling-down providers.
- Provider labels no longer make unverified quality claims.
- Provider origins and URL builders live in the typed provider registry; the
  arbitrary production `NEXT_PUBLIC_EMBED_PROVIDER` override is no longer used
  for iframe construction.
- The timeout effect keeps its hard deadline when the warning state renders and
  automatically moves to the next unattempted provider.
- Watch routes no longer pass a competing pre-built iframe URL.

## Verification

- `npm test -- --run`: 30 files, 140 tests passing.
- `npm run typecheck`: passing.
- `npm run lint`: passing.
- `npm run build`: passing.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- `tests/e2e/player.spec.ts`: 2 passing checks for immediate manual switching
  and malformed TV route rejection.
- Isolated Chromium E2E: PASS — 61/61.
- Isolated Mobile Chrome E2E: PASS — 61/61.
- GitHub Actions Verify run `34905876802`: PASS on exact head `5b51b2c839e040c2a3a19eaee73214ee28ade642`; install, lint, typecheck, unit, build, desktop E2E, Mobile E2E, audit, and cleanup all passed.
- Authenticated in-app browser observation reached the Ready Vercel Preview application shell and player routes, but Preview remains UNVERIFIED because direct HTTP/headless access reaches Vercel Deployment Protection and no authenticated mobile viewport was available.
- The focused player E2E suite: 2 tests passing after the attempt-state
  integration.
- The isolated live smoke suite (`playwright.live.config.ts`): `BLOCKED_BY_ENVIRONMENT`
  when explicitly opted in against the current Ready Preview. Vercel
  Deployment Protection prevented the movie Server 1 and TV episode assertions
  from reaching VEYRA's player shell, so this run does not establish provider
  failure. It remains excluded from normal CI because external deployment and
  provider availability are conditional; it did not promote an iframe or HTTP
  response to playback success.

## Quality and external limitations

The configured providers are opaque cross-origin embeds. VEYRA can truthfully
report frame-document load and timeout/error signals, but cannot claim that a
video is playing or expose a resolution selector without a documented provider
ready/quality API. Live provider availability and playback visibility require a
headed-browser smoke run and are intentionally not inferred from HTTP status or
iframe load alone.

## Provider matrix (live production route)

Smoke inspection of `/watch/movie/1007757` on the deployed route recorded the
following source-level results. These are external-provider observations, not
claims that VEYRA can guarantee availability.

| Provider | Movie frame | Visible result | VEYRA conclusion |
|---|---|---|---|
| Server 1 / `v1.vidsrc.wiki` | Loaded | Provider player rendered; playback not independently confirmed | PLAYBACK NOT VERIFIABLE |
| Server 2 / `vidsrc.xyz` | Loaded | Provider frame rendered during inspection | PLAYBACK NOT VERIFIABLE |
| Server 3 / `www.2embed.cc` | Attempted | Remained in the VEYRA connecting state during the sample | SLOW / TIMEOUT SAMPLE |
| Server 4 / `player.autoembed.cc` | Loaded | Browser reported that the provider host IP could not be resolved | NETWORK ERROR |

The inspection also captured a cross-origin browser security error from the
third-party page; VEYRA does not attempt to bypass that boundary.

## Observability

Privacy-safe client events now distinguish attempt, frame load, timeout, frame
error, automatic failover, manual switch, provider success, and exhaustion.
They include only provider ID, media type, bounded timing, attempt index,
error category, network hint, and pathname; iframe URLs and user data are not
sent.

## Browser evidence

The local production build was opened at `/watch/movie/1007757`. Server 1
rendered an external player frame, and selecting Server 2 changed the iframe
source immediately; the automated Playwright measurement completed within one
second. The frame later exposed provider controls and an “Unable to play media”
state, confirming that iframe load is not equivalent to verified playback.

The production alias returned HTTP 200 for the checked routes, but the
available Vercel connector returned 403 when listing deployments and creating
a protected share URL. The new Preview was observed through an authenticated
in-app browser session, but the required Preview browser matrix remains
unverified because direct headless access is Deployment Protection gated.
Production verification against the eventual merged SHA remains pending.

An earlier production-alias browser observation rendered the TV route's episode
metadata, episode list, and next-episode navigation. Its external frame was
treated with the same playback-verification limitation as the movie route; the
current Preview smoke did not expose the episode metadata within its assertion
window.

## Remaining external limitations

The live suite records provider frame/origin outcomes, but opaque providers do
not expose enough documented signals to claim visible playback programmatically.
Provider availability, licensing, and browser/network restrictions remain
external to VEYRA. The production alias returned HTTP 200 for the checked
routes, but the current production deployment could not be associated with
local commit `5b51b2c` through the available Vercel inspection data. The live
smoke suite remains separate from normal CI because deployment and provider
availability are conditional.

## Current worktree verification

### Goal 3 release verification — 2026-09-14

Run from local commit `5b51b2c` on
`fix/release-readiness-blockers`. This checkout differs from referenced commit
`1c9918d645fa7b5f2368d8bb31cf512f9a2cd576`; its branch is not `main`.

| Check | Result |
|---|---|
| Typecheck, lint, build | PASS |
| Unit tests | PASS — 30 files, 140 tests |
| Dependency audit | PASS — 0 production vulnerabilities |
| Chromium E2E | PASS — 61/61 |
| Mobile Chrome E2E | PASS — 61/61 |
| Live smoke against current Preview | `BLOCKED_BY_ENVIRONMENT` — Vercel Deployment Protection prevented movie Server 1 and TV episode assertions from reaching the player shell; default `npm run test:live` skips without opt-in |
| GitHub Actions for `5b51b2c` | PASS — run `34905876802` on the exact head; install, lint, typecheck, unit, build, desktop E2E, Mobile E2E, audit, and cleanup passed |
| Vercel Preview | UNVERIFIED — GitHub Vercel status Ready for deployment target `AQZe7g93K8KE28wZcvm3xE6q5aGx`; authenticated in-app shell observation exists, but direct headless access is Deployment Protection and mobile Preview viewport access was unavailable |
| Vercel production | PENDING — must be verified after merge against the new main SHA |

An authenticated in-app browser observed the application shell, catalog,
detail, watch, provider-selection, and unavailable anime routes. `/anime/1`
returned the existing VEYRA 404 detail boundary; anime catalog links go directly
to `/watch/anime/<id>/1`, where playback remains truthfully unavailable. Direct
unauthenticated HTTP/headless browser requests reached Vercel's `Login – Vercel`
Deployment Protection, so a full Playwright Preview count and mobile Preview
result are not claimed. `PREVIEW_VERIFIED` remains UNVERIFIED. The local E2E suite
covers movie, TV, anime, unavailable/failure states,
manual switching, offline/reconnect, mobile layout, keyboard accessibility,
and truthful frame-load messaging. Live smoke requires `VEYRA_LIVE_SMOKE=1`
and is never part of normal product E2E. An explicit run against the production
alias failed on the deployed player controls; a default run without that
variable skips both external checks by design.
CI sets `PLAYWRIGHT_TEST_BASE_URL` explicitly for the local production server;
live smoke accepts `PLAYWRIGHT_LIVE_BASE_URL` and requires the exact
`VEYRA_LIVE_SMOKE=1` opt-in. CI runs Chromium and Mobile Chrome as separate
bounded steps so each project gets a fresh local production server; the
readiness assertions wait for the landing content before measuring focus and
geometry without changing the underlying accessibility or touch-target checks.
Opaque provider playback, quality, subtitle, and audio capabilities remain
unverified. Provider availability, cross-origin controls, licensing, and
network restrictions are external limitations.

### Referenced GitHub commit reproduction

The exact commit `1c9918d645fa7b5f2368d8bb31cf512f9a2cd576` was installed in a
separate worktree and verified locally. Dependency installation, lint,
typecheck, 33 unit-test files with 146 tests, production build, and audit all
passed. Its E2E run reproduced the GitHub failure with 46 tests total and 12
failures. The failures were concentrated in missing Anime navigation and player
assertions that require visible server/theater controls while the commit's
trust gate correctly renders providers as unavailable/unverified. This is
evidence that the referenced Actions failure is a test/implementation mismatch,
separate from external provider playback availability.

## Final verdict

**CODE_VERIFIED • LOCAL_E2E_VERIFIED • CI_VERIFIED • PREVIEW_VERIFIED (UNVERIFIED)**

Player state, bounded failover foundations, trust/ranking controls, security
boundaries, accessibility shell behavior, and deterministic E2E coverage are verified.
The authenticated Preview shell observation is recorded, and the exact-head CI run
is green. `PREVIEW_VERIFIED` remains unverified until an accessible Preview browser
matrix completes. `PRODUCTION_SHELL_VERIFIED` remains
pending until the merge produces a new production deployment. Provider-owned
playback capabilities, quality, subtitles, audio, and completion remain
unverified.

The current worktree adds explicit attempt/provider identity guards, typed
opaque-provider capabilities, hard trust eligibility, TTL timestamps, bounded
half-open circuit trials, scoped Reload player recovery, and accessibility E2E
coverage. The deterministic unit suite contains 140 passing tests.

The latest isolated Playwright runs launched Chromium successfully and passed
the full deterministic matrix: 61/61 on each desktop Chromium and Mobile
Chrome project.

The isolated live smoke suite was rerun with explicit opt-in against the current
Preview and was `BLOCKED_BY_ENVIRONMENT` because Vercel Deployment Protection
prevented both player assertions from reaching the VEYRA shell. It does not
establish provider failure or alter the verified-unavailable product state.


The combined local `npm run test:e2e` command is **PASS**: 122/122 tests pass. The command dispatches Chromium and Mobile Chrome as separate Playwright processes, so each project receives a fresh bounded production server. CI retains the same separate-step structure.
