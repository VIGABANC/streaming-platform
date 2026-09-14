# VEYRA player provider verification matrix

This release audit records only evidence that VEYRA can verify. An iframe
response or load event does not prove playback, quality, subtitles, audio,
completion, or bitrate.

| Provider | Configured | Frame/load evidence | Verified playback | Status |
|---|---:|---|---|---|
| `vidsrc-wiki` | Yes | External frame may load | No | UNAVAILABLE for verified playback |
| `vidsrc-xyz` | Yes | External frame may load | No | UNAVAILABLE for verified playback |
| `2embed` | Yes | External behavior is inconsistent | No | UNAVAILABLE for verified playback |
| `autoembed` | Yes | External host/network behavior is inconsistent | No | UNAVAILABLE for verified playback |
| Anime providers | No | No approved verified provider | No | UNAVAILABLE |

The configured providers remain behind VEYRA's verification gate. They are not
enabled for verified playback claims based on an iframe load. Provider uptime,
cross-origin controls, licensing, and network restrictions are external
limitations. See [provider-capability-matrix.md](./provider-capability-matrix.md)
for the detailed capability and origin audit.

## Goal 3 smoke result — 2026-09-14

The explicit live smoke against the Ready Preview recorded:

- Movie `/watch/movie/1007757`: `BLOCKED_BY_ENVIRONMENT` — Vercel Deployment
  Protection prevented the expected Server 1 control from being reached within
  45 seconds.
- TV `/watch/tv/1399/1/1`: `BLOCKED_BY_ENVIRONMENT` — Vercel Deployment
  Protection prevented `Season 1, Episode 1` from being reached within the
  assertion window.
- Anime `/watch/anime/1/1`: remains `UNAVAILABLE` because no approved verified
  anime provider is configured.

The deterministic player suite verifies manual selection, timeout/failure,
failover, offline/reconnect, theater/lights-off/fullscreen shell behavior,
mobile layout, keyboard accessibility, and the truthful
“frame loaded; not independently verified” state with controlled fixtures.
These VEYRA-controlled checks passed in local and CI runs. The explicit smoke
remains conditional because Preview access is Deployment Protection gated and
the cross-origin providers and their controls are outside VEYRA's control. These
results do not establish provider failure or playback success.
