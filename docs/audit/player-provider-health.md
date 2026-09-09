# Provider health model

Health is local, bounded, and TTL-limited. Reliability uses an EWMA/prior, startup latency uses an EWMA, recent failures and timeout frequency reduce rank, and repeated failures open a circuit with 60-second, 5-minute, then 15-minute cooldowns. Cooldown expiry allows one half-open trial; a success closes the circuit and a failure reopens it.

The model records provider identifiers and timing counters only. It does not collect GPS, raw iframe URLs, or invasive network identifiers. A frame `load` is telemetry only and never increments success.
