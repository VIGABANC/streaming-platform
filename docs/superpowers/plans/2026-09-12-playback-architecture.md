# VEYRA playback architecture implementation plan

## Task 1 — Establish typed playback contracts

1. Add playback domain types for media identity, provider capabilities, authorization/verification state, source availability, engine mode, timeout/rate-limit policy, and runtime health.
2. Refactor the existing provider definitions into the typed registry while preserving existing provider IDs and current test fixtures.
3. Add strict URL validation and route segment validation tests.

## Task 2 — Centralize source resolution and engines

1. Add a resolver that maps media identity to ranked registry candidates and validated `PlaybackSource` objects.
2. Move URL construction out of movie/TV pages and remove the unused arbitrary `src` escape hatch from `PlayerFrame`.
3. Update `ExternalEmbedEngine` to consume resolved sources.
4. Add a guarded `NativeMediaEngine` and native media component. Do not enable it without an authorized direct source.

## Task 3 — Integrate all watch flows and state

1. Support movie, TV, and Anime playback request types.
2. Add the anime episode route with truthful unavailable behavior when no provider supports Anime.
3. Persist media type, season, episode, provider, playback mode, verification state, and native position in continue-watching state.
4. Preserve existing TV previous/next episode navigation and detail return paths.

## Task 4 — Reliability, observability, and UX

1. Keep attempt identity guards, bounded failover, cooldown, retry, and offline handling while filtering by supported media type.
2. Expand privacy-safe player events to include native start, retry, source exhausted, and ended events without URLs or user data.
3. Add visible mode/capability messaging and keyboard/mobile presentation controls without implying unsupported playback controls.

## Task 5 — Verify and document

1. Run lint, typecheck, unit tests, E2E tests, build, and security audit.
2. Keep live provider smoke separate and report frame load versus playback verification.
3. Update README, provider matrix, control ownership, and reliability docs with the final limitations.
