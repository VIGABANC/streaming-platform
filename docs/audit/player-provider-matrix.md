# VEYRA provider matrix — 2026-09-15

An iframe response or load event does not prove playback, quality, subtitles,
audio, completion, or bitrate.

| Provider | Media | Registry status | Eligible now | Truthful UI state |
|---|---|---|---:|---|
| `vidsrc-wiki` | Movie/TV | `unverified`, opaque external embed | No | Unavailable |
| `vidsrc-xyz` | Movie/TV | `unverified`, opaque external embed | No | Unavailable |
| `2embed` | Movie/TV | `unverified`, opaque external embed | No | Unavailable |
| `autoembed` | Movie/TV | `unverified`, opaque external embed | No | Unavailable |
| Anime providers | Anime | No approved verified provider | No | Unavailable |

No provider was enabled because an iframe loaded. No new provider, mirror,
scraper, stream extractor, or user-data-bearing URL was added.

## Verification status

- Deterministic local player behavior: `PASS`.
- Default live smoke: `PASS`, with opt-in external checks skipped.
- Explicit live-provider playback: `LIVE_PROVIDER_PLAYBACK_UNVERIFIED` /
  `BLOCKED_BY_ENVIRONMENT` when Deployment Protection prevents access.
- CI run `34943517664`: `PASS` for exact head
  `6c3cd4365d83e0f4cdce31aee7941c7c385baee8`.
- Vercel connector: `VERCEL_API_INSPECTION_BLOCKED_BY_AUTH` (HTTP 403).

Provider authorization, cross-origin controls, licensing, availability, and
documented playback APIs are external limitations. Only a future provider with
explicit authorization evidence, origin checks, and a trusted documented signal
may move into the eligible set.
