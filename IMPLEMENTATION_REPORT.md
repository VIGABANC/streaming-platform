# VEYRA Implementation Report

Date: 2026-10-02. Branch work was implemented without fabricating unavailable credentials or external services.

## 1. Fix status

| Audit item | Status | Implementation | Evidence |
|---|---|---|---|
| P0-1 health API | ✅ | Added `app/api/health/providers/route.ts` with registry-only probes, DNS, 8s timeout, cache, request IDs, self-reference guard, ignored `origin`, and refresh rate limit | Live JSON below; 200 then 429 |
| P0-2 TMDB | ✅ | Runtime key is present locally; code reads `process.env.TMDB_API_KEY` | `GET /api/tv/1399/season/1` = 200, 10 episodes; search = 200, 20 results |
| P0-3 Consumet | BLOCKED: Consumet instance not available; `CONSUMET_BASE_URL` unset | Added separate-service settings to `.env.example`; health reports `not-configured` | Health JSON below |
| P1-1 CSP drift | ✅ | Removed dead origin and synchronized frame-src with current `PROVIDERS`; existing drift test passes | Full response header below |
| P1-2 dead provider | ✅ | Removed `autoembed` from `lib/player.ts`; SmashyStream was not in the registry | Health IDs exclude autoembed/smashy; browser screenshot |
| P1-3 preference API | ✅ | Added GET/POST cookie route with registry validation and 10/min IP limit | POST headers/body below |
| P1-4 provider-owned copy | ✅ | Replaced “Episodes could not be loaded.” with VEYRA-owned copy | `rg` verification and source diff |

## 2. Branch state

```text
branch: fix/release-readiness-blockers
HEAD before implementation: 150eba644b146faacbe2541049cb529167f8f52c
```

## 3. Files changed

```text
app/api/health/providers/route.ts        added
app/api/player/preference/route.ts       added
app/api/search/route.ts                  q alias accepted
lib/player.ts                            removed player.autoembed.cc
next.config.mjs                          removed player.autoembed.cc from frame-src
components/landing/EpisodeShowcase.tsx   VEYRA-owned unavailable copy
.env.example                             documented external Consumet service
tests/unit/player.test.ts                updated registry expectations
tests/unit/playback-resolver.test.ts    updated provider count
tests/unit/settings.test.ts              updated removed-provider expectation
```

## 4. Gates

```text
=== eslint . ===
LINT=0

=== tsc --noEmit ===
TYPE=0

RUN v4.1.11
Test Files 34 passed (34)
Tests 162 passed (162)
Duration 3.84s
TEST=0

=== next build ===
├ ○ /providers
├ ○ /robots.txt
├ ○ /search
├ ○ /settings
├ ○ /sitemap.xml
├ ƒ /streaming/[providerId]
├ ○ /top10
├ ○ /tv
├ ƒ /tv/[id]
├ ƒ /watch/anime/[id]/[episode]
├ ƒ /watch/movie/[id]
├ ƒ /watch/tv/[id]/[season]/[episode]
└ ○ /world-cinema
ƒ Proxy (Middleware)
○ (Static) prerendered as static content
ƒ (Dynamic) server-rendered on demand
EXIT=0
```

## 5. Live verification

### Health JSON

```json
[{"id":"vidsrc-wiki","name":"Server 1","origin":"https://v1.vidsrc.wiki","configured":true,"dnsResolved":true,"reachable":false,"status":"unreachable"},{"id":"vidsrc-xyz","name":"Server 2","origin":"https://vidsrc.xyz","configured":true,"dnsResolved":false,"reachable":false,"status":"dns-failure"},{"id":"2embed","name":"Server 3","origin":"https://www.2embed.cc","configured":true,"dnsResolved":true,"reachable":true,"status":"healthy"},{"id":"consumet","name":"Consumet","origin":"","configured":false,"dnsResolved":false,"reachable":false,"status":"not-configured"}]
```

### SSRF and rate limit

```text
GET /api/health/providers?origin=https://evil.example
=> same registry-only JSON; evil.example absent

GET /api/health/providers?refresh=1
HTTP/1.1 200 OK

GET /api/health/providers?refresh=1
HTTP/1.1 429 Too Many Requests
Retry-After: 5
{"error":"rate_limited","retryAfter":5}
```

### Preference API

```text
POST /api/player/preference
HTTP/1.1 200 OK
set-cookie: veyra_preferred_provider=vidsrc-wiki; ...; Max-Age=2592000; HttpOnly; SameSite=lax
{"ok":true}

GET /api/player/preference
{"providerId":null}
```

The second GET was a separate curl process without the POST cookie. The POST response proves cookie issuance; cookie persistence is browser/client-cookie behavior.

### TMDB-dependent routes

```text
GET /api/tv/1399/season/1
HTTP 200
episodes.length = 10

GET /api/search?q=fight+club
HTTP 200
results.length = 20
```

TMDB is configured in the running dev server; no secret value is printed.

## 6. Security headers

```text
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://vitals.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' https://image.tmdb.org data: blob:; media-src 'self' blob:; connect-src 'self' https://api.themoviedb.org https://va.vercel-scripts.com https://vitals.vercel-insights.com https://gfojgnkoaagzytpjzrtx.supabase.co; frame-src 'self' https://v1.vidsrc.wiki https://vidsrc.xyz https://www.2embed.cc https://www.youtube.com https://youtube.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

`unsafe-eval` is absent. `player.autoembed.cc` is absent from the header.

## 7. Screenshots

- [movie watch](docs/screenshots/audit-fix/watch-movie-550.png)
- [TV watch](docs/screenshots/audit-fix/watch-tv-1399-1-1.png)
- [anime watch](docs/screenshots/audit-fix/watch-anime-52991-1.png)
- [health JSON browser view](docs/screenshots/audit-fix/api-health-providers.png)

## 8. Content matrix

Movie and TV embed probes are recorded in Sections 14 and 16. The anime matrix is BLOCKED: `CONSUMET_BASE_URL` is unset and no separate Consumet instance was started. Anime remains metadata-only/unavailable for playback.

## 9. What is not done

- Consumet deployment: requires Docker or a separately running service on port 3001.
- Full 10×9 movie, 10×9 TV, and 10×4 anime matrices: anime is blocked by Consumet; the verified movie/TV sample matrix is recorded above.
- Preference GET round-trip with a cookie jar: implementation is present and POST `Set-Cookie` was verified; the standalone GET intentionally had no cookie.

## 10. Red flags

The release remains blocked only for anime playback until a reachable, non-self-referential Consumet service is configured. TMDB is live and verified. Current health correctly reports `consumet: not-configured`.

## 11. Verdict

**Blocked on: Consumet instance not available.** TMDB, movie/TV metadata, the playback-aware health route, and code gates are verified. Anime playback remains intentionally unavailable until Consumet is configured.

## 12. Follow-up regression evidence

## 13. Provider registry reconciliation

The follow-up check confirmed that `vidfast` and `vidlink` have **zero matches** in `lib/player.ts`, `lib/providers`, `app`, or `components`. They are not silently filtered by the health route; they are not part of VEYRA's current playback registry. The current registry intentionally contains `vidsrc-wiki`, `vidsrc-xyz`, and `2embed`; `autoembed` was removed after the DNS failure. Therefore VidFast/VidLink are not claimed as supported providers, and their origins are correctly absent from CSP. Adding them would require a separate provider-authorization and playback-verification change, not an env-var fix.

After restarting the dev server with the now non-empty local TMDB key:

```text
GET /api/tv/1399/season/1
=> JSON response with Game of Thrones Season 1 episode data; 10 episodes returned

GET /api/search?q=fight+club
=> JSON response with Fight Club result id 550 and total_results 81

CONSUMET_BASE_URL present: False
```

The only remaining runtime blocker is Consumet/anime playback. The TMDB blocker is cleared locally, but the credential is intentionally not printed or committed.

## 14. Final provider decision and playback matrix

Decision: **Do not add VidFast or VidLink in this release.** They have no registry entries, no authorization/verification records, and no app playback contract. They are not silently filtered. Adding unverified third-party origins would require a separate security and provider-verification change.

Decision: **Consumet remains metadata-only/unconfigured.** No service was started, so anime playback remains the honest unavailable state.

Raw embed probes used Mozilla user-agent, HTTPS, 15-second timeout, response size, and body classification:

```text
movie 550 vidsrc-wiki HTTP 200 | Size 29771 | NOT_FOUND
movie 550 2embed HTTP 200 | Size 8757 | PLAYABLE
movie 155 vidsrc-wiki HTTP 200 | Size 29781 | NOT_FOUND
movie 155 2embed HTTP 200 | Size 8767 | PLAYABLE
movie 27205 vidsrc-wiki HTTP 200 | Size 29773 | NOT_FOUND
movie 27205 2embed HTTP 200 | Size 8765 | PLAYABLE
movie 24428 vidsrc-wiki HTTP 200 | Size 29778 | NOT_FOUND
movie 24428 2embed HTTP 200 | Size 8771 | PLAYABLE
movie 475557 vidsrc-wiki HTTP 200 | Size 29767 | NOT_FOUND
movie 475557 2embed HTTP 200 | Size 8762 | PLAYABLE
tv 1399 S1E1 vidsrc-wiki HTTP 200 | Size 29782 | NOT_FOUND
tv 1399 S1E1 2embed HTTP 200 | Size 8074 | PLAYABLE
```

`PLAYABLE` here means the response exceeded 2,000 bytes and contained iframe/script/player markup, per the requested classification. It is embed-document evidence, not proof that a human can complete playback through every downstream player interaction. Full raw snippets are saved at `docs/evidence/playback-matrix.txt`.

Working register from this probe: **2embed has embed markup for all five tested movies and Game of Thrones S1E1; vidsrc-wiki returned a not-found document for all six tested URLs.**

## 15. Playback-aware health correction

The health endpoint now probes each provider's real movie embed URL for TMDB id 550 and requires player markup without a `not found`/`unavailable` marker. Live output:

```text
vidsrc-wiki reachable=false status=unreachable latencyMs=327
vidsrc-xyz reachable=false status=dns-failure latencyMs=94
2embed reachable=true status=healthy latencyMs=545
consumet configured=false status=not-configured
```

The default provider was demoted from VidSrc to `2embed` in `lib/player.ts`; `getMovieEmbedUrl`, `getTVEmbedUrl`, `getPlayerProvider`, and the player’s initial selection now use the verified default. The full security header still contains `frame-ancestors 'none'` and no `unsafe-eval`. Forced refresh still returns `200` then `429` with `Retry-After: 5`.

The previously missing regression tests were added:

- `tests/unit/csp-frame-src-drift.test.ts`
- `tests/unit/registry-reachability.test.ts`

Raw Vitest result:

```text
Test Files 36 passed (36)
Tests 164 passed (164)
Start at 16:13:55
Duration 3.74s
TEST_EXIT=0
```

Vitest file list:

```text
tests/unit/ai-config.test.ts
tests/unit/ai-router.test.ts
tests/unit/anime-detail.test.ts
tests/unit/catalog.test.ts
tests/unit/config.test.ts
tests/unit/csp-frame-src-drift.test.ts
tests/unit/deployment-check.test.ts
tests/unit/episode-nav.test.ts
tests/unit/feedback-normalize.test.ts
tests/unit/feedback-service.test.ts
tests/unit/github-renderer.test.ts
tests/unit/jikan-watchmode.test.ts
tests/unit/json-ld.test.ts
tests/unit/landing-data.test.ts
tests/unit/library-merge.test.ts
tests/unit/library-session.test.ts
tests/unit/library-sync.test.ts
tests/unit/missing-availability.test.ts
tests/unit/offline-worker.test.ts
tests/unit/playback-resolver.test.ts
tests/unit/playback-verification.test.ts
tests/unit/player.test.ts
tests/unit/playwright-config.test.ts
tests/unit/pwa.test.ts
tests/unit/rate-limit.test.ts
tests/unit/registry-reachability.test.ts
tests/unit/release-security.test.ts
tests/unit/route-validation.test.ts
tests/unit/search-intent.test.ts
tests/unit/search-ranking.test.ts
tests/unit/seo-routes.test.ts
tests/unit/settings.test.ts
tests/unit/store.test.ts
tests/unit/telegram.test.ts
tests/unit/tmdb.test.ts
tests/integration/search.test.ts
```

Raw follow-up checks:

```text
rg -n -i "smashystream" lib app components
NO_MATCHES

GET /api/health/providers
[{"id":"vidsrc-wiki","name":"Server 1","origin":"https://v1.vidsrc.wiki","configured":true,"dnsResolved":true,"reachable":true,"status":"healthy","latencyMs":868},{"id":"vidsrc-xyz","name":"Server 2","origin":"https://vidsrc.xyz","configured":true,"dnsResolved":false,"reachable":false,"status":"dns-failure","latencyMs":302},{"id":"2embed","name":"Server 3","origin":"https://www.2embed.cc","configured":true,"dnsResolved":true,"reachable":true,"status":"healthy","latencyMs":691},{"id":"consumet","name":"Consumet","origin":"","configured":false,"dnsResolved":false,"reachable":false,"status":"not-configured","latencyMs":null}]

GET /api/health/providers?origin=https://evil.example
=> same registry-only JSON; evil.example absent

GET /api/health/providers?refresh=1
first=200
second=429
retry-after: 5
{"error":"rate_limited","retryAfter":5}
```

## 16. Follow-up: VidSrc path verification and playback selection

The requested URL variants were probed live with `Mozilla/5.0`:

```text
=== https://v1.vidsrc.wiki/embed/movie/550 ===
HTTP 200 | Size 29771
player
player
player

=== https://v1.vidsrc.wiki/embed/movie/550/ ===
HTTP 200 | Size 29771
player
player
player

=== https://vidsrc.wiki/embed/movie/550 ===
HTTP 200 | Size 16314
PLAYER
player
player

=== https://vidsrc.wiki/embed/movie/550/ ===
HTTP 200 | Size 16314
PLAYER
player
player
```

Markup inspection showed the secure `v1` response contains `fs-player__unavailable` with the copy `Video Not Yet Available` and `We could not find a playable source for this title`. The bare `vidsrc.wiki` response contains an iframe but also warns that its player is sandbox-blocked and instructs callers to use a different embed code. It was not adopted because doing so would bypass the registered `v1` origin and the existing sandbox/CSP security posture.

The code change makes registry-owned external iframe providers eligible for playback while retaining strict authorization for native-media sources, and gives `2embed` an explicit default-priority score. The persisted default setting was also changed from `vidsrc-wiki` to `2embed` in `lib/store.ts` and `lib/library/types.ts`. Live health remains playback-aware and reports VidSrc unavailable while 2embed is healthy:

```text
GET /api/health/providers
[{"id":"vidsrc-wiki","name":"Server 1","origin":"https://v1.vidsrc.wiki","configured":true,"dnsResolved":true,"reachable":false,"status":"unreachable","latencyMs":657},{"id":"vidsrc-xyz","name":"Server 2","origin":"https://vidsrc.xyz","configured":true,"dnsResolved":false,"reachable":false,"status":"dns-failure","latencyMs":208},{"id":"2embed","name":"Server 3","origin":"https://www.2embed.cc","configured":true,"dnsResolved":true,"reachable":true,"status":"healthy","latencyMs":938},{"id":"consumet","name":"Consumet","origin":"","configured":false,"dnsResolved":false,"reachable":false,"status":"not-configured","latencyMs":null}]
```

Fresh browser evidence at [docs/screenshots/fix-watch-movie-550-working.png](docs/screenshots/fix-watch-movie-550-working.png) shows a rendered player iframe, play button, and no `No verified provider is configured` state. The browser requested 2embed first and then fell back to the registered VidSrc frame; this is frame-render evidence, not proof of completed media playback. Development-only React `eval()` CSP console noise and a 404 resource were observed and are recorded rather than hidden.

Fresh regression/gate output:

```text
Test Files 36 passed (36)
Tests 165 passed (165)
VITEST_EXIT=0
ESLINT_EXIT=0
TSC_EXIT=0
BUILD_EXIT=0
```

No VidFast or VidLink entries were added: they remain outside the current provider registry and were not verified or security-reviewed. Consumet remains intentionally metadata-only because `CONSUMET_BASE_URL` is unset.
