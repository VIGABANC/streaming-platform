# Player Accessibility Audit

**Standard:** WCAG 2.1 AA
**Scope:** `/watch/movie/1007757` player shell
**Evidence date:** 2026-09-09

## Summary

The player shell has semantic server buttons, selected-state exposure, a named
server group, conservative live loading copy, keyboard activation, reduced
motion support, and mobile overflow coverage. External provider controls remain
outside VEYRA's accessibility boundary.

## Findings

| Area | Criterion | Result | Evidence |
|---|---|---|---|
| Server controls | 1.3.1 / 4.1.2 | Pass | Buttons expose `aria-pressed`; group is named `Playback servers`. |
| Keyboard activation | 2.1.1 / 2.4.7 | Pass | Playwright focuses Server 2, presses Enter, preserves focus, and observes selection. |
| Status communication | 4.1.3 | Partial | VEYRA loading and error states use live text; provider-internal status is unavailable cross-origin. |
| Reduced motion | 2.3.3 | Pass | Reduced-motion E2E assertion keeps the player visible and functional. |
| Mobile layout | 1.4.10 / 2.5.5 | Partial | Viewport overflow is tested; provider-owned controls require separate headed-browser review. |
| Error recovery | 3.3.1 | Pass | Timeout/offline copy and Reload player / server-switch actions are visible. |
| External iframe | 1.1.1 / 4.1.2 | Limited | Provider DOM and accessibility cannot be asserted from VEYRA due to cross-origin isolation. |

## Remaining manual review

- Run NVDA/VoiceOver against a deployed watch route.
- Verify color contrast at 200% zoom and forced-colors mode.
- Verify each currently approved provider's own controls in a headed browser.
- Re-run at 375x812, 390x844, and 430x932 after any player layout change.
