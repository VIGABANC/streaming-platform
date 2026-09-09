# Player UX verification

| Issue | Ownership | Result |
|---|---|---|
| Play/pause icon sync | provider | documented limitation; not claimed fixed |
| Skip/seek/volume/mute | provider | documented limitation; not claimed fixed |
| Settings/quality | provider | no fake controls; shell labels provider-controlled |
| Theater/cinema | VEYRA | shell toggle retained |
| PiP exit chrome | browser/OS/provider | limitation documented |
| Fullscreen | VEYRA shell/browser | container fullscreen implemented |
| Player-loaded overlay | VEYRA | removed; frame load is not playback-ready |
| Slow checking/failover | VEYRA | bounded attempt deadline and ranked next provider |
| AutoEmbed DNS/unreachable | external provider | generic unreachable/timeout treatment; no DNS overclaim |
| unavailable title | VEYRA shell | bounded exhausted state with retry/reload |

Mobile, keyboard, reduced-motion, and focus behavior are covered by the deterministic Playwright shell suite. Real provider playback remains external and unverified unless visible playback is confirmed separately.
