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

- `npm test -- --run`: 22 files, 105 tests passing.
- `npm run typecheck`: passing.
- `npm run lint`: passing.
- `npm run build`: passing.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- `tests/e2e/player.spec.ts`: 2 passing checks for immediate manual switching
  and malformed TV route rejection.
- The complete E2E suite: 78 tests passing across Chromium and Mobile Chrome.
- The focused player E2E suite: 2 tests passing after the attempt-state
  integration.
- The isolated live smoke suite (`playwright.live.config.ts`): 2 tests passed
  against the deployed movie and TV routes; it remains excluded from normal CI
  because provider uptime is external.

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

The deployed Vercel route was re-deployed from this verified worktree and now
serves neutral `Server 1`–`Server 4` labels, the truthful frame-load message,
and the current player controls. Deployment ID:
`dpl_U7LcvBknU1eg32SPxqxqpez12b9q` (production alias
`https://streaming-platform-beryl.vercel.app`).

The deployed TV route `/watch/tv/1399/1/1` rendered the episode metadata,
episode list, and next-episode navigation. Its external frame was treated with
the same playback-verification limitation as the movie route.

## Remaining external limitations

The live suite records provider frame/origin outcomes, but opaque providers do
not expose enough documented signals to claim visible playback programmatically.
Provider availability, licensing, and browser/network restrictions remain
external to VEYRA. The production deployment itself is complete and verified;
the live smoke suite remains separate from normal CI because provider uptime is
external.

## Current worktree verification

## Final verdict

**P0 VERIFIED — P1/P2 PENDING**

P0 player state, bounded failover foundations, trust/ranking controls, security
boundaries, accessibility shell behavior, deterministic E2E coverage, and live
route smoke evidence are verified. P1/P2 remain pending where provider-owned
playback capabilities, persisted missing-availability workflow, and broader
legitimate World Cinema metadata enrichment are not yet implemented or
independently verifiable.

The current worktree adds explicit attempt/provider identity guards, typed
opaque-provider capabilities, hard trust eligibility, TTL timestamps, bounded
half-open circuit trials, scoped Reload player recovery, and accessibility E2E
coverage. The deterministic unit suite contains 111 passing tests.

The full Playwright matrix covers 87 tests across Chromium and Mobile Chrome;
the player subset passes on both projects. A prior full run exposed one flaky
landing selector that matched two identical mobile navigation nodes; the test
now scopes to the first rendered navigation and the isolated rerun passes.

The isolated live smoke suite was rerun against
`https://streaming-platform-beryl.vercel.app`: both approved checks passed for
movie `1007757` and TV `1399 / S1 / E1`. These results establish route and
provider-frame observations only; the configured cross-origin providers remain
opaque, so the suite does not claim visible playback confirmation.
