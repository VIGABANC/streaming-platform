# VEYRA browser-audit fix report

Date: 2026-10-02

## 1. Fix status

| ID | Status | Implementation | Evidence |
|---|---|---|---|
| BROWSER-P0-1 | ✅ | External iframe providers are no longer blocked by the redundant trust/authorization gate; 2embed is default-ranked. | Movie and TV browser screenshots; fresh HTTP 200 iframe responses below. |
| BROWSER-P0-2 | ✅ | Health probes use each provider's real movie embed URL and player-markup checks, with cache/rate limiting retained. | `health-before.json` vs `health-after.json`; live after JSON below. |
| BROWSER-P1-1 | ✅ | Repeated-character low-vote TMDB false positives are removed in `rankSearchResults`. | `/api/search?q=zzzzzz` returned HTTP 200 and `results.length = 0`; `search-empty.png`. |
| BROWSER-P1-2 | ✅ | Landing navigation now has an accessible `Open search` link to `/search`. | `home-search-open.png`; browser click navigated from `/` to `/search`. |
| BROWSER-P2-1 | ✅ | Removed hydration-sensitive search `autoFocus`; replaced eager client hero animation with server-rendered markup. | Browser console scan for `/search`, `/`, `/anime`, `/top10`: no hydration warnings. |
| BROWSER-P2-2 | ✅ | First anime and Top 10 images use eager loading/priority; remaining images lazy-load. | Browser console scan: no LCP advisories on `/anime` or `/top10`. |
| BROWSER-P2-3 | ✅ | Below-fold landing sections are dynamically split and mounted near the viewport. | Production Lighthouse improved to performance 0.72 and TBT 405ms. |

## 2. Branch state

```text
branch: feat/browser-audit-fixes
commit: `fix: unblock movie/TV playback and close browser audit issues`
full SHA: see the fresh `git rev-parse HEAD` output in the handoff below
```

## 3. Files changed

```text
lib/player.ts
lib/store.ts
lib/library/types.ts
lib/search-ranking.ts
app/anime/page.tsx
app/search/page.tsx
components/landing/CinematicHero.tsx
components/landing/HomeCatalog.tsx
components/landing/LandingNav.tsx
components/landing/DeferredHomeSections.tsx
components/media/RankedCard.tsx
tests/unit/player.test.ts
tests/unit/playback-resolver.test.ts
tests/unit/search-ranking.test.ts
FIX_REPORT.md
docs/screenshots/fix/
```

## 4. Gates

Fresh commands after the fixes:

```text
npx eslint .
exit 0; no output

npx tsc --noEmit
exit 0

npx vitest run
Test Files 36 passed (36)
Tests 166 passed (166)
Start at 22:16:14
Duration 4.55s
exit 0

npx next build
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (30/30)
exit 0
```

The production route table includes `/api/health/providers`, `/api/search`, `/watch/movie/[id]`, and `/watch/tv/[id]/[season]/[episode]`; `/watch/dev-fixture` is absent.

## 5. Health before/after

Before evidence is saved at [docs/screenshots/fix/health-before.json](docs/screenshots/fix/health-before.json). It recorded VidSrc as healthy despite dead title embeds.

After evidence is saved at [docs/screenshots/fix/health-after.json](docs/screenshots/fix/health-after.json). Fresh live output:

```json
[{"id":"vidsrc-wiki","name":"Server 1","origin":"https://v1.vidsrc.wiki","configured":true,"dnsResolved":true,"reachable":false,"status":"unreachable","latencyMs":701,"lastCheckedAt":"2026-10-02T20:50:43.523Z"},{"id":"vidsrc-xyz","name":"Server 2","origin":"https://vidsrc.xyz","configured":true,"dnsResolved":false,"reachable":false,"status":"dns-failure","latencyMs":10,"lastCheckedAt":"2026-10-02T20:50:43.526Z"},{"id":"2embed","name":"Server 3","origin":"https://www.2embed.cc","configured":true,"dnsResolved":true,"reachable":true,"status":"healthy","latencyMs":505,"lastCheckedAt":"2026-10-02T20:50:43.526Z"},{"id":"consumet","name":"Consumet","origin":"","configured":false,"dnsResolved":false,"reachable":false,"status":"not-configured","latencyMs":null,"lastCheckedAt":"2026-10-02T20:50:43.527Z"}]
```

The endpoint still ignores user-supplied `origin`, caches ordinary calls for 60 seconds, and returns 429 with `Retry-After: 5` on a second forced refresh.

## 6. Browser screenshots and network evidence

- [watch-movie-550-working.png](docs/screenshots/fix/watch-movie-550-working.png): player iframe rendered; unavailable-provider copy absent.
- [watch-tv-1399-1-1-working.png](docs/screenshots/fix/watch-tv-1399-1-1-working.png): TV player iframe rendered; unavailable-provider copy absent.
- [search-empty.png](docs/screenshots/fix/search-empty.png): exact empty state `No titles found for "zzzzzz"`.
- [home-search-open.png](docs/screenshots/fix/home-search-open.png): landing search affordance navigated to `/search`, where the search input is visible.

Fresh Playwright network/DOM evidence:

```text
movie /watch/movie/550
iframeCount=1
noVerified=0
https://www.2embed.cc/embed/550 -> HTTP 200

tv /watch/tv/1399/1/1
iframeCount=1
noVerified=0
https://www.2embed.cc/embedtv/1399&s=1&e=1 -> HTTP 200
https://v1.vidsrc.wiki/embed/tv/1399/1/1/ -> HTTP 200 (fallback frame)
```

The evidence proves iframe rendering and provider-document HTTP success; it does not claim completion of downstream video playback. The TV screenshot visibly shows the provider frame in a loading state, so that limitation remains explicit.

Browser console scan after the fixes:

```json
{
  "/search?q=zzzzzz": [],
  "/anime": [],
  "/top10": [],
  "/": []
}
```

This scan reports no hydration or LCP warnings. Development-only Next/React `eval()` noise can still appear under the development CSP and is not a production playback failure.

## 7. Lighthouse before/after

| Run | Mode | Performance | TBT | LCP |
|---|---|---:|---:|---:|
| Audit baseline | development | 0.34 | 13,200ms | 11,100ms |
| Intermediate | production | 0.34 | 8,279ms | 6,723ms |
| Final | production | 0.72 | 405ms | 4,654ms |

Final raw report: [lighthouse-home-production-final.json](docs/screenshots/fix/lighthouse-home-production-final.json). Lighthouse writes the JSON successfully but exits with a Windows temporary-directory cleanup `EPERM`; the report is present and was parsed for the scores above.

## 8. What is not done

- Consumet/anime playback remains unconfigured because `CONSUMET_BASE_URL` is unset. Anime metadata remains available and anime playback remains an honest unavailable state.
- VidFast and VidLink were not added: they are not in the current registry and have not been independently verified or security-reviewed.
- The iframe evidence is not a claim that a human can complete playback through every downstream provider interaction.

## 9. Red flags

- Only 2embed currently passes the real movie-embed health probe. VidSrc is correctly demoted as unavailable, so movie/TV fallback redundancy remains thin.
- The bare `vidsrc.wiki` host was not adopted because its response warns that its player is sandbox-blocked; the secure registered `v1.vidsrc.wiki` origin remains in CSP.
- Lighthouse's Windows cleanup `EPERM` is an environment/tooling issue; the JSON report itself was produced.

## 10. Verdict

**Blocked on: Consumet/anime playback and thin movie/TV provider redundancy.** The browser P0 no-iframe failure is fixed, all P0/P1 browser issues are ✅, the P2 fixes are verified, and production Lighthouse meets the requested performance targets. The release should not be called fully ready until anime playback is intentionally configured or explicitly excluded from the release scope.
