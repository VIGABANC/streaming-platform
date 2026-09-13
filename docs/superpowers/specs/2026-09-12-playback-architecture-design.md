# VEYRA playback architecture design

## Decision

Keep the current external iframe providers behind `ExternalEmbedEngine`, but make their limits explicit. Add a typed `NativeMediaEngine` contract for authorized direct MP4/HLS/DASH sources without enabling a provider that has not supplied a verified source. All source construction moves behind one resolver service.

The current third-party iframe origins remain opaque and are classified as `authorization: unverified`, `verification: frame-load-only`, and `quality: provider-controlled`. They may be observed as frame candidates only; VEYRA must not claim playback, quality, subtitles, audio tracks, bitrate, or provider readiness. The user-provided API list is not integrated merely because an endpoint exists: unknown, scraping-oriented, or unauthorized providers remain unavailable until their authorization and documented capabilities are verified.

## Domain model

`PlaybackRequest` identifies `movie`, `tv`, or `anime` media and optional positive season/episode segments. `PlaybackSource` is the only object consumed by the player. It contains provider identity, mode, validated URL, supported capabilities, availability state, and verification state.

`ExternalEmbedEngine` owns VEYRA’s container, loading, error, retry, switch, theater, lights-off, and container fullscreen behavior. The iframe provider owns controls inside its document. `NativeMediaEngine` owns native controls only for validated HTTPS direct media sources whose authorization is explicitly `authorized`.

## Provider registry and resolver

Provider definitions declare identity, authorization, supported media, episode support, playback mode, regions, quality/subtitle/audio capability, readiness evidence, timeout and rate-limit policy, and runtime health metadata. Provider URL builders remain server/client-safe pure functions but can only be reached by the registry/resolver.

`resolvePlaybackSources(request)` validates media IDs and route segments, filters providers by media and region, ranks them using existing health/circuit data, builds URLs, and validates exact HTTPS origins. It never accepts an arbitrary runtime URL override. Resolver statuses distinguish `success`, `empty`, `unavailable`, `invalid`, and `partial`.

## Reliability

The existing attempt identity guard remains the source of truth. Provider switching invalidates the previous attempt; timers are bounded; failed providers are recorded and cooled down; retry uses the existing bounded cycle; offline/reconnect invalidates stale callbacks. Failures are categorized as timeout, frame error, network failure, unsupported, unavailable, or playback-not-verifiable.

Frame load is recorded as `frame_loaded`, never as playback success. Native playback emits separate started/progress/ended events and can persist real position. Provider URLs and user data never enter telemetry.

## UX

The player displays the active mode and control ownership. External embeds show “Provider controlled” and no quality selector. Native sources can expose real quality/caption/audio controls only when the source capability says so. Anime gets an episode watch route, but no anime provider is invented; if no verified source exists, the route shows a clear unavailable state.

## Verification

Add unit tests for registry shape, URL validation, resolver filtering/ranking, native capability mapping, route validation, cooldown/circuit behavior, and stale attempts. Expand E2E fixtures for manual switch, failover, timeout, retry, offline/reconnect, native control ownership, movie/TV/anime routes, presentation modes, and mobile layout. Keep external-provider smoke tests separate and label their result as frame observation only.
