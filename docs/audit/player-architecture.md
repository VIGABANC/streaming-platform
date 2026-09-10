# Player architecture

VEYRA currently has one authorized playback mode: `ExternalEmbedEngine`, represented by `PlayerFrame`. All configured providers are opaque cross-origin iframes. A future `NativeMediaEngine` may be added only when an authorized MP4/HLS/DASH source is supplied; no such source is present in this repository.

The shell owns provider selection, bounded attempts, failover, health/circuit state, loading/error UI, theater/cinema presentation, fullscreen of the VEYRA container, iframe permissions, and truthful capability labels. Provider-internal play, seek, volume, captions, quality, and fullscreen controls remain provider-owned and are not manipulated across the origin boundary.

Attempt callbacks carry both monotonically increasing `attemptId` and `providerId`. Warning UI cannot cancel the hard deadline. Each provider is attempted at most once per cycle, and offline/exhausted states invalidate callbacks.
