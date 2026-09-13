# Player architecture

VEYRA has two explicit engine contracts: `ExternalEmbedEngine` for opaque
cross-origin iframes and `NativeMediaEngine` for authorized MP4/HLS/DASH
sources. No current provider is authorized: every configured external provider
has a `PlaybackProviderVerification` record with `enabled: false`, so the
resolver returns `unavailable` until a complete verification record exists.
No native source is present in this repository.

The shell owns eligible-provider selection, bounded attempts, failover,
health/circuit state, loading/error UI, theater/lights-off presentation,
fullscreen of the VEYRA container, iframe permissions, and truthful capability
labels. Provider-internal play, seek, volume, captions, quality, and fullscreen
controls remain provider-owned and are not manipulated across the origin
boundary.

Attempt callbacks carry both monotonically increasing `attemptId` and `providerId`. Warning UI cannot cancel the hard deadline. Each provider is attempted at most once per cycle, and offline/exhausted states invalidate callbacks.
