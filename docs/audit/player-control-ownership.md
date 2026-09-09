# Player control ownership

| Capability | Current owner | VEYRA behavior |
|---|---|---|
| Provider selection/failover | VEYRA | ranked, bounded, manual switch |
| Loading/error/retry status | VEYRA | truthful shell status |
| Theater/cinema presentation | VEYRA | shell presentation toggle |
| Shell fullscreen | VEYRA/browser | fullscreen targets the VEYRA container |
| Play/pause, seek, skip, volume, mute | Provider iframe | not accessible cross-origin |
| Quality, captions, audio tracks, speed | Provider iframe | not fabricated; quality says provider-controlled |
| Native PiP chrome | Browser/OS/provider | no custom browser PiP close button claimed |
| Continue watching progress | Unverified | iframe load is not recorded as watched progress |
| Auto-next | Unverified | no opaque iframe completion event assumed |

The visible provider control bar in screenshots is therefore not a VEYRA-controlled surface. A complete native control checklist is reserved for a future authorized direct-media engine.
