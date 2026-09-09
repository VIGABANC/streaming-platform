# VEYRA Player Reliability Design

## Goal

Make external playback failure bounded, observable, recoverable, and truthful:
no indefinite connecting state, no stale callback corruption, no unbounded
provider cycling, and no claims that an opaque iframe proves playback.

## Current evidence

The existing player already has a provider registry, contextual ranking
foundation, client health storage, a timeout-warning state, and an attempt
state module. Focused unit tests and the repository baseline are green. The
current audit also shows that all configured providers are opaque cross-origin
embeds, so frame load is the strongest currently verified browser signal.

## Architecture

`PlayerFrame` owns the UI lifecycle and delegates attempt identity to
`lib/player-attempt.ts`. Each attempt has a monotonically increasing ID and a
provider ID. Timer, iframe load, iframe error, offline, reconnect, and manual
switch callbacks must validate both values against the current state before
mutating UI or health.

The provider registry in `lib/player.ts` is the single source for URL builders,
origins, supported media types, capability claims, trust eligibility, and future
postMessage origins. Ranking is deterministic and only considers eligible,
unattempted providers whose circuit is not open. Technical health is separate
from trust eligibility.

## State and signals

The lifecycle is:

`idle → selecting → connecting → timeout-warning → frame-loaded → failed → switching → exhausted`

`offline` invalidates the current attempt and stops failover. Returning online
starts one fresh cycle. A bare iframe load emits `FRAME_LOADED` only; it does
not update playback success, progress, completion, audio, subtitles, or quality.

## Timers and failover

Warning and hard-deadline timers are owned by the attempt identity, not by the
warning UI state. A warning render cannot cancel the hard deadline. Each
eligible provider is attempted at most once per cycle. Definitive error or
deadline failure records the failure and selects the next ranked candidate.
When no candidate remains, the player enters `exhausted` with a scoped reload
action and clear user-facing copy.

## Health model

Health is bounded and TTL-controlled. Reliability uses a conservative prior;
latency uses EWMA; repeated failures open a circuit with approximately 60-second,
5-minute, and 15-minute cooldown progression. Cooldown expiry permits one
half-open recovery trial. No GPS, raw iframe URL, personal data, or invasive ISP
identifier is collected.

## Security

The registry and CSP must agree on exact frame origins. Production custom embed
environment variables cannot introduce arbitrary origins. Provider postMessage
support, if added, must require exact `event.origin`, schema validation, current
attempt binding, and known event types. Opaque providers receive no invented
capabilities and no broader iframe privileges than required.

## Testing

Deterministic tests cover warning/hard-deadline preservation, stale callbacks,
manual switching, bounded failover, exhaustion, offline/reconnect, ranking
priors, latency, circuit transitions, trust gates, and truthful capabilities.
Focused E2E tests cover immediate manual switching, automatic failover,
exhaustion, malformed TV routes, keyboard/focus behavior, and mobile layout.
Live provider smoke tests remain separate from CI and may report environment or
external-provider limitations without failing deterministic builds.

## Scope boundaries

This phase does not extract HLS/DASH manifests, bypass provider restrictions,
discover random mirrors, fabricate quality controls, or claim licensed direct
playback. Language-aware World Cinema search, missing-content reporting, and
advanced subtitle/audio preferences follow only after P0 verification.
