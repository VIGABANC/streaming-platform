# VEYRA Provider Registry Refresh — Fix Report

## 1. Fix status

| Item | Status | Evidence |
|---|---|---|
| P0 resolver gate | ✅ | `lib/player.ts`; `tests/unit/playback-fallback.test.ts` passes 4/4. |
| Movie playback | ✅ | Real 2Embed iframe with poster/title/play control: `docs/screenshots/fix/watch-movie-550-working.png`. |
| TV playback | ✅ | Real 2Embed TV iframe: `docs/screenshots/fix/watch-tv-1399-1-1-working.png`. |
| Registry refresh | ✅ | Five providers in priority order: VidFast, VidLink, 2Embed, Videasy, Nontongo. |
| Dead provider removal | ✅ | No production matches for VidSrc, AutoEmbed, or SmashyStream; reachability test passes. |
| CSP synchronization | ✅ | Live header contains all five origins, `frame-ancestors 'none'`, and no `unsafe-eval`. |
| Embed-aware health | ✅ | `app/api/health/providers/route.ts` probes movie embeds and requires HTTP 200, >2,000 bytes, and player markup. |
| Fallback coverage | ✅ | Four fallback tests pass. |

## 2. Branch state

```text
Branch: feat/provider-registry-refresh
Base: fa71708eb71aea53fb02f408b5edf5ab049fadea
Requested commit: fix: unblock playback resolver and refresh provider registry
```

## 3. Files changed

```text
app/api/health/providers/route.ts
app/layout.tsx
components/player/PlayerFrame.tsx
lib/library/types.ts
lib/player.ts
lib/store.ts
next.config.mjs
tests/unit/playback-fallback.test.ts
tests/unit/playback-resolver.test.ts
tests/unit/player.test.ts
tests/unit/registry-reachability.test.ts
tests/unit/settings.test.ts
docs/screenshots/fix/watch-movie-550-working.png
docs/screenshots/fix/watch-tv-1399-1-1-working.png
docs/screenshots/fix/server-bar-five-providers.png
docs/screenshots/fix/health-json-after.png
docs/screenshots/fix/fallback-to-vidfast.png
```

Unrelated pre-existing worktree files were not staged.

## 4. Gates — raw output

### `npx eslint .`

```text
Process exited with code 0. No warnings or errors.
```

### `npx tsc --noEmit`

```text
Process exited with code 0. No output.
```

### `npx vitest run`

```text
RUN  v4.1.11
Test Files  37 passed (37)
     Tests  170 passed (170)
Start at  20:19:23
Duration  10.25s
```

### `npx next build`

```text
✓ Compiled successfully in 2.7s
Finished TypeScript in 7.1s
Generating static pages using 11 workers (30/30) in 12.1s
Finalizing page optimization ...
ƒ /api/health/providers
ƒ /api/player/preference
ƒ /api/search
ƒ /api/tv/[id]/season/[season]
ƒ /watch/movie/[id]
ƒ /watch/tv/[id]/[season]/[episode]
○ (Static) prerendered as static content
ƒ (Dynamic) server-rendered as dynamic content
```

The build emitted a non-fatal Jikan connection timeout while prerendering; it exited 0 and generated all 30 static pages.

## 5. Health JSON — before/after

Before the refresh, the live response contained only `vidsrc-wiki`, `vidsrc-xyz`, `2embed`, and `consumet`; the VidSrc entries were unreachable/DNS-failed.

After refresh, raw live response:

```json
[{"id":"vidfast","name":"VidFast","origin":"https://vidfast.pro","configured":true,"dnsResolved":true,"reachable":false,"status":"embed-unavailable","latencyMs":7006},{"id":"vidlink","name":"VidLink","origin":"https://vidlink.pro","configured":true,"dnsResolved":true,"reachable":false,"status":"embed-unavailable","latencyMs":3600},{"id":"2embed","name":"2Embed","origin":"https://www.2embed.cc","configured":true,"dnsResolved":true,"reachable":true,"status":"healthy","latencyMs":1348},{"id":"videasy","name":"Videasy","origin":"https://player.videasy.net","configured":true,"dnsResolved":true,"reachable":false,"status":"unreachable","latencyMs":5806},{"id":"nontongo","name":"Nontongo","origin":"https://nontongo.win","configured":true,"dnsResolved":true,"reachable":false,"status":"unreachable","latencyMs":8758},{"id":"consumet","name":"Consumet","origin":"","configured":false,"dnsResolved":false,"reachable":false,"status":"not-configured","latencyMs":null}]
```

The SSRF request `?origin=https://evil.example` returned the same registry-only JSON and contained no `evil.example`. Forced-refresh raw statuses:

```text
200
429
```

The supplied external sweep proved playable markup for all five providers; the app health result above is a separate server-side embed probe and currently agrees only for 2Embed.

## 6. Browser screenshots

- `docs/screenshots/fix/watch-movie-550-working.png` — 2Embed iframe visibly shows poster, title, and play control.
- `docs/screenshots/fix/watch-tv-1399-1-1-working.png` — 2Embed TV iframe rendered.
- `docs/screenshots/fix/server-bar-five-providers.png` — all five refreshed providers visible.
- `docs/screenshots/fix/health-json-after.png` — live health JSON opened in browser.
- `docs/screenshots/fix/fallback-to-vidfast.png` — VidFast selected; fallback ranking is also covered by the passing regression test.

## 7. Working register

| Provider | Content | Title/episode | Evidence |
|---|---|---|---|
| 2Embed | Movie | Fight Club, TMDB 550 | Browser iframe screenshot; sweep HTTP 200, 8,757 bytes. |
| 2Embed | TV | Game of Thrones S1E1, TMDB 1399 | Browser iframe screenshot; sweep HTTP 200, 8,074 bytes. |
| VidFast | Movie/TV markup | TMDB 550 / 1399 S1E1 | Supplied sweep HTTP 200, 169,492 / 170,644 bytes. |
| VidLink | Movie/TV markup | TMDB 550 / 1399 S1E1 | Supplied sweep HTTP 200, 83,452 / 24,023 bytes. |
| Videasy | Movie/TV markup | TMDB 550 / 1399 S1E1 | Supplied sweep HTTP 200, 18,079 / 18,008 bytes. |
| Nontongo | Movie/TV markup | TMDB 550 / 1399 S1E1 | Supplied sweep HTTP 200, 185,540 / 184,881 bytes. |

The first two rows are human-visible iframe evidence. The remaining rows are markup evidence, not proof of completed human playback.

## 8. What is not done

- Consumet is not configured; anime playback remains unavailable by design.
- The server-side health probe currently disagrees with the supplied live sweep for four refreshed providers and needs a follow-up investigation before health dots are treated as authoritative.
- The full 10-title movie/TV matrix was not rerun in this pass.

## 9. Verdict

**Blocked on: health-probe parity and Consumet configuration.**

The P0 “no iframe at all” blocker is fixed: a real 2Embed iframe is visible in both movie and TV screenshots. The registry, CSP, resolver, and gates are green. Anime remains metadata-only until Consumet is run, and the health-probe parity discrepancy must be resolved before claiming all five providers are health-verified.
