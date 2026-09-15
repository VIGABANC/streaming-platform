# VEYRA player reliability report — 2026-09-15

The player enforces a verification gate before constructing an external frame.
The four configured external providers are `unverified`, so the current product
state is unavailable for movie and TV playback. Anime has no approved provider.

## Verified behavior

- Provider ranking excludes unverified and unauthorized sources.
- Invalid movie, TV, and anime identities are rejected before source creation.
- Retry, reload, timeout, error, failover, and offline/reconnect state machines
  preserve attempt identity and do not trust stale callbacks.
- Manual selection is available only when a provider source is eligible.
- Theater mode, lights-off mode, container fullscreen, mobile controls, focus,
  keyboard activation, and truthful unavailable messaging are covered by E2E.
- `frame-loaded; playback not independently verified` is the only iframe load
  state. It is never recorded as playback success.

## Current verification evidence

| Check | Result |
|---|---|
| Unit suite | PASS — 34 files / 161 tests |
| Typecheck | PASS |
| Lint | PASS |
| Build | PASS — 40 routes listed |
| Deterministic E2E | PASS — Chromium 65/65; Mobile Chrome 65/65 |
| Default live smoke | PASS — opt-in external tests skipped by design |
| Explicit provider smoke | EXTERNAL / CONDITIONAL; no playback claim |
| CI | Historical PASS on `fb007601` run `34906508855`; fresh repair-head run pending |

The local browser suite uses the real production routes and asserts the trust
boundary. It does not add a test-only provider, scrape media, extract streams,
or make third-party availability a deterministic CI dependency.

## External limitations

The provider pages are cross-origin and opaque. VEYRA cannot verify their
license, actual video playback, quality, subtitles, audio tracks, progress, or
completion from an iframe load. DNS, network policy, provider uptime, and
Deployment Protection are outside the application boundary. These results are
classified as `LIVE_PROVIDER_PLAYBACK_UNVERIFIED`, `EXTERNAL_FAILURE`,
`TIMEOUT`, or `BLOCKED_BY_ENVIRONMENT` when observed; they are never upgraded
to success.
