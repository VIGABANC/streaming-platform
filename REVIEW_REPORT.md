# VEYRA Full UI/UX, Functionality, and Performance Review

Date: 2026-10-04
Scope: Next.js app, catalog/search/detail/watch journeys, provider controls, responsive/accessibility surfaces, and current live dev server.

## Executive result

The app is functional for movie and TV playback through 2Embed. A live browser scan found the refreshed five-provider bar, metadata pages, navigation, provider switching, iframe loading, cinema mode, theater mode, and fullscreen controls. The most important UX defect was fixed during this review: the default provider opened VidFast, which was browser-blocked in the current environment, while 2Embed rendered a real player frame. The default is now 2Embed; the registry fallback order remains VidFast, VidLink, 2Embed, Videasy, Nontongo.

## Evidence collected

- Browser movie journey: `docs/screenshots/fix/watch-movie-550-working.png` — 2Embed iframe visibly rendered with poster, title, and play control.
- Browser TV journey: `docs/screenshots/fix/watch-tv-1399-1-1-working.png` — TV iframe rendered.
- Provider control scan: `docs/screenshots/fix/server-bar-five-providers.png` — five provider controls visible.
- Health endpoint browser capture: `docs/screenshots/fix/health-json-after.png`.
- Fallback capture: `docs/screenshots/fix/fallback-to-vidfast.png`.
- Live health endpoint: six registry rows including five embed providers plus Consumet; SSRF `origin=https://evil.example` was ignored; forced refresh returned `200` then `429`.

## Findings and fixes

### F-01 — Fixed — default provider opened a blocked frame

Severity: P1

The browser opened VidFast by default and showed a Chromium blocked-frame error. Selecting 2Embed immediately rendered the Fight Club player frame. `DEFAULT_PROVIDER`, persisted defaults, and the library default now use `2embed`. This is a measured UX correction based on browser evidence, not a claim that VidFast is dead globally.

### F-02 — Accepted limitation — provider health parity

Severity: P1 residual

The server health route now probes actual embed URLs, but in this environment it reports only 2Embed healthy while the supplied external sweep reports playable markup for VidFast, VidLink, Videasy, and Nontongo. The discrepancy is documented in `FIX_REPORT.md`; health dots must not be interpreted as proof of completed playback until the network/probe path is reconciled.

### F-03 — Accepted limitation — anime playback

Severity: P1 residual

`CONSUMET_BASE_URL` is unset. The app correctly presents an honest unavailable state instead of fabricating a player. Anime metadata remains available where Jikan responds.

### F-04 — Verified — accessible provider controls

Provider controls are native buttons with `aria-pressed`, grouped under `Playback servers`, and expose provider health text. Cinema, theater, fullscreen, retry, next-server, and back actions have accessible names. Focus-visible styling exists globally and reduced-motion rules are present.

### F-05 — Improvement opportunity — raw `<img>` in player overlays

The player’s transient artwork overlays still use raw `<img>` elements. They are decorative and correctly hidden from assistive technology, but Next.js image optimization is not used. This is a P2 performance opportunity; it was not changed because the overlays are short-lived and changing them would require validating remote image sizing and blur behavior.

### F-06 — Improvement opportunity — very large related-title lists

Detail pages can render many related-title cards. The current evidence did not establish a memory or interaction regression, so virtualization was not introduced. If catalog sizes grow, measure scroll performance first and then consider windowing.

## UX checklist result

| Area | Result | Evidence/notes |
|---|---|---|
| Keyboard/focus | Pass in source review | Skip link, native controls, focus-visible rules. |
| Screen-reader semantics | Pass with minor review items | Provider group and status regions are labeled; decorative artwork is hidden. |
| Touch targets | Mostly pass | Primary controls use `min-h-11`; compact server chips should be rechecked at 375px. |
| Responsive layout | Existing screenshots available | Desktop and prior browser screenshots exist; no new horizontal-scroll defect was observed. |
| Loading/error states | Pass | Loading, offline, retry, next-server, and unavailable states have explicit copy and CTAs. |
| Reduced motion | Pass in source review | `motion-reduce` and `prefers-reduced-motion` rules are present. |
| Color-only status | Needs follow-up | Provider dots are paired with accessible text, but automated contrast measurement should be added. |
| Navigation | Pass in browser scan | Main navigation and back-to-detail path were visible and routable. |

## Functionality matrix

| Journey | Result |
|---|---|
| Home/catalog navigation | Verified in existing browser scan artifacts. |
| Search and empty state | Existing screenshot artifact `docs/screenshots/fix/search-empty.png`; explicit empty copy present. |
| Movie detail → watch | Verified for Fight Club / 550. |
| TV detail → watch | Verified for Game of Thrones / 1399 S1E1. |
| Provider switching | Verified; switching to 2Embed rendered the iframe. |
| Retry/failover | Covered by `tests/unit/playback-fallback.test.ts`. |
| Anime watch | Honest unavailable state because Consumet is not configured. |
| Preferences | Existing route and persisted provider defaults covered by unit tests. |

## Performance review

No new optimization claim is made without a before/after benchmark. Existing Lighthouse JSON artifacts are present under `docs/screenshots/fix/`, but this pass did not change a performance hotspot or establish a controlled before/after comparison. The largest measured user-facing issue was provider startup failure, addressed by selecting the browser-verified provider as the default.

## Verification gates

```text
npx eslint .       — exit 0
npx tsc --noEmit   — exit 0
npx vitest run     — 37 files, 170 tests passed
```

## Remaining actions

1. Reconcile server-side provider probing with browser embed behavior.
2. Configure a separate Consumet service before claiming anime playback.
3. Add automated 375px/keyboard/contrast browser assertions to prevent UX regressions.

## Verdict

**Movie/TV user experience: functional with 2Embed as the verified default.**

**Overall release status: partially shippable; blocked on provider-health parity and Consumet if anime playback is required.**
