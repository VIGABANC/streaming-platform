# Provider Health Model

The player keeps bounded client-side health summaries for ranking and failover.
The model is contextual rather than a universal provider score.

## Current fields

`providerId`, attempts, successes, failures, timeouts, consecutive failures,
success EWMA, startup-latency EWMA, last attempt, last success, last failure,
cooldown, and circuit state.

## Required behavior

- Reliability uses a bounded prior so a single observation cannot dominate a
  long history.
- Startup latency uses EWMA rather than unbounded raw timing history.
- Providers are attempted once per cycle and excluded after an open circuit.
- Cooldowns progress through approximately 60 seconds, 5 minutes, and 15
  minutes; recovery requires a bounded half-open trial.
- Health is advisory. Trust eligibility, exact origin, and product approval are
  required before ranking can select a provider.
- Future aggregate health may segment only by privacy-safe coarse region,
  media type, and network class; no GPS or invasive ISP identifiers.

## Current gap

The existing client implementation has the ranking and cooldown foundation but
still needs explicit registry-level trust eligibility, persisted TTL timestamps,
and a deterministic half-open trial policy before P0 can be considered complete.
