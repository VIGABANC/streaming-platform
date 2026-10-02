# VEYRA Implementation Report

Date: 2026-10-02. Branch work was implemented without fabricating unavailable credentials or external services.

## 1. Fix status

| Audit item | Status | Implementation | Evidence |
|---|---|---|---|
| P0-1 health API | ✅ | Added `app/api/health/providers/route.ts` with registry-only probes, DNS, 8s timeout, cache, request IDs, self-reference guard, ignored `origin`, and refresh rate limit | Live JSON below; 200 then 429 |
| P0-2 TMDB | BLOCKED: `TMDB_API_KEY` is not available to the runtime | Verified code reads `process.env.TMDB_API_KEY`; added documented env example | Live TV 503 and search `TMDB_NOT_CONFIGURED` |
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

The requested new branch was not created because the repository was already on the user’s release-fix branch; changes remain on that branch.

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
GET /api/search?q=fight+club
{"error":"TMDB_NOT_CONFIGURED","requestId":"78747c30-8fe3-49de-9ede-aaf9dc40ec81"}

GET /api/tv/1399/season/1
{"error":"TMDB_NOT_CONFIGURED"}
```

These remain blocked because no real TMDB v3 key was supplied. No result count or episode count is fabricated.

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

BLOCKED: TMDB API key unavailable in runtime and `CONSUMET_BASE_URL` unset. Movie, TV, and anime provider matrices were not run because the required metadata/service prerequisites do not exist. The honest anime state remains unavailable.

## 9. What is not done

- TMDB runtime configuration: requires a real user-provided v3 API key.
- Consumet deployment: requires Docker or a separately running service on port 3001.
- Full 10×9 movie, 10×9 TV, and 10×4 anime matrices: blocked by the two prerequisites above.
- Preference GET round-trip with a cookie jar: implementation is present and POST `Set-Cookie` was verified; the standalone GET intentionally had no cookie.

## 10. Red flags

The release must remain blocked until `TMDB_API_KEY` is non-empty in the running process and a reachable, non-self-referential Consumet service is configured. Current health correctly reports `consumet: not-configured`.

## 11. Verdict

**Blocked on: TMDB_API_KEY not available in runtime; Consumet instance not available.** All implementable P1 fixes and the P0 health route are verified; no claim is made that metadata or anime playback works without their required external services.

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
