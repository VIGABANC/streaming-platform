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
