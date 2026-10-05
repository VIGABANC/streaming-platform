# VEYRA Final Audit Report

Audit date: 2026-10-02 (Africa/Casablanca). Scope was read-only; no application code was changed or committed.

## 1. Environment snapshot

Raw evidence:

```text
branch: fix/release-readiness-blockers
HEAD: 150eba644b146faacbe2541049cb529167f8f52c
git status --short: clean at audit start
node: v24.18.0
pnpm: host shim exists, but pnpm.exe was blocked by Application Control policy
```

The env-name scan found `TMDB_API_KEY`, but not `CONSUMET_BASE_URL`. The running app loaded `.env.local`; the live TV API response proves the effective TMDB configuration was unusable (`TMDB_NOT_CONFIGURED`). `CONSUMET_BASE_URL` is unset. Dev server: `http://localhost:3000`, Next.js 16.3.3/Turbopack.

Evidence files: `docs/evidence/page-http.tsv`; command output was captured in the audit session.

## 2. Gates

```text
pnpm lint: blocked before execution by host Application Control policy.
Direct installed fallback: eslint . -> exit 0

pnpm typecheck: blocked before execution by host Application Control policy.
Direct installed fallback: tsc --noEmit -> exit 0

pnpm test: blocked before execution by host Application Control policy.
Direct installed fallback:
Test Files 34 passed (34)
Tests 162 passed (162)
Duration 5.01s
exit 0

pnpm build: blocked before execution by host Application Control policy.
Direct installed fallback: next build -> exit 0
```

Build route output included `/watch/anime/[id]/[episode]`, `/watch/movie/[id]`, `/watch/tv/[id]/[season]/[episode]`, and no `/watch/dev-fixture`; therefore the dev fixture is not a production route.

## 3. Page-by-page results

The live HTTP sweep returned 200 for all tested real pages: `/`, `/movies`, `/tv`, `/anime`, `/search`, `/discover`, `/new`, `/top10`, `/my-list`, `/favorites`, `/history`, `/profile`, `/settings`, `/providers`, `/provider/vidfast`, `/streaming/vidfast`, `/movie/550`, `/tv/1399`, `/anime/52991`, `/person/1`, `/collection/10`, `/genre/movie/28`, `/world-cinema`, `/browse`, `/landing`, `/offline`, `/auth/login`, `/auth/sign-up`, `/watch/movie/550`, `/watch/tv/1399/1/1`, `/watch/anime/52991/1`. `/watch/dev-fixture` and `/_not-found` returned 404.

Screenshots captured at 1440x900 for the key page/content routes:

- [home](docs/screenshots/pages/home.png)
- [movies](docs/screenshots/pages/_movies.png), [tv](docs/screenshots/pages/_tv.png), [anime](docs/screenshots/pages/_anime.png), [search](docs/screenshots/pages/_search.png)
- [movie detail](docs/screenshots/pages/_movie_550.png), [TV detail](docs/screenshots/pages/_tv_1399.png), [anime detail](docs/screenshots/pages/_anime_52991.png)
- [movie watch](docs/screenshots/pages/_watch_movie_550.png), [TV watch](docs/screenshots/pages/_watch_tv_1399_1_1.png), [anime watch](docs/screenshots/pages/_watch_anime_52991_1.png)
- [offline](docs/screenshots/pages/_offline.png), [login](docs/screenshots/pages/_auth_login.png), [sign-up](docs/screenshots/pages/_auth_sign-up.png)

The source route is `/streaming/[providerId]`, not the requested `/streaming/[id]`; this is naming-compatible at runtime but should be documented consistently. Page metadata is present from the shared layout in captured HTML (title, description, canonical, OG title/description).

## 4. API-by-API results

Only four API route files exist: `/api/missing-availability`, `/api/search`, `/api/telegram/webhook`, `/api/tv/[id]/season/[season]`. The requested `/api/health/providers` and `/api/player/preference` routes do not exist and returned the HTML Next 404 page, not JSON.

| Endpoint | Method | HTTP | Body/result | Evidence |
|---|---:|---:|---|---|
| `/api/health/providers` | GET | 404 | HTML Next not-found | live curl output |
| `/api/missing-availability` | GET | 404 | HTML Next not-found | live curl output |
| `/api/player/preference` | GET | 404 | HTML Next not-found | live curl output |
| `/api/search?q=fight+club` | GET | 200 | `{"results":[]}` | live curl output |
| `/api/telegram/webhook` | GET | 405 | method not allowed | live curl output |
| `/api/tv/1399/season/1` | GET | 503 | `{"error":"TMDB_NOT_CONFIGURED"}` | live curl output |

The search API returning an empty array while TMDB is not configured is an observable degraded-data state. The health SSRF/rate-limit tests could not execute because the endpoint is absent.

## 5. Movie matrix

Blocked/unverified. No evidence-backed movie-provider matrix can be claimed because the application has no `forceProvider` API contract verified in the live watch page, and the required metadata configuration is unavailable. Direct origin probes are recorded in Section 9. Do not interpret this section as provider success.

## 6. TV matrix

Blocked/unverified for the same reason. The live season request for Game of Thrones returned HTTP 503 `TMDB_NOT_CONFIGURED`; therefore S1E1/finale episode identifiers could not be obtained from the application.

## 7. Anime matrix

BLOCKED: `CONSUMET_BASE_URL` is unset. No Consumet provider request was made and no anime provider is classified as working.

## 8. Search results

`/search?q=fight+club`, `/search?q=breaking+bad`, `/search?q=frieren`, `/search?q=2024`, `/search?q=action`, and `/search?q=zzzzzzzz` were not fully claimable as content-behavior tests because the live search API is metadata-configured to return an empty result set. The base search screenshot is [here](docs/screenshots/pages/_search.png). Direct API evidence: `GET /api/search?q=fight+club -> 200 {"results":[]}`.

## 9. Provider health (live)

Independent direct probes:

```text
vidsrc.sbs          HTTP 403 | DNS 0.121411s | Time 0.651477s
vidfast.pro         HTTP 301 | DNS 0.079301s | Time 0.282592s
vidlink.pro         HTTP 200 | DNS 0.116964s | Time 0.462013s
www.2embed.cc       HTTP 200 | DNS 0.142392s | Time 0.509422s
getsuperembed.link  HTTP 200 | DNS 0.186631s | Time 0.646389s
smashystream.com    HTTP 000 | DNS 0.138768s | Time 0.732407s; schannel certificate principal failure
player.videasy.net  HTTP 301 | DNS 0.122199s | Time 0.602000s
nontongo.win        HTTP 200 | DNS 0.122442s | Time 0.756010s
player.autoembed.cc HTTP 000 | DNS 0.000000s | Time 0.120896s; could not resolve host
```

The app health endpoint is absent, so app-vs-direct agreement cannot be checked.

## 10. Sandbox + CSP

Source evidence: `components/player/PlayerFrame.tsx:648` contains `sandbox="allow-scripts allow-same-origin allow-presentation"`; it includes the required two permissions, does not include `allow-top-navigation`, and is non-empty.

Live response headers include `Content-Security-Policy` with `frame-src`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `frame-ancestors 'none'`. `next.config.mjs` contains no `unsafe-eval`.

The observed `frame-src` allowlist contains `v1.vidsrc.wiki`, `vidsrc.xyz`, `www.2embed.cc`, `player.autoembed.cc`, YouTube; it does not contain every provider named in the requested audit scope. This is a security/playback configuration gap, not proof that each missing provider should be added.

## 11. Error states

The requested fault-injection states were not executed because they require changing runtime configuration/source or mocking providers, which conflicts with the instruction not to change code during the scan. Verified states:

- Invalid/dev fixture route: `/watch/dev-fixture -> 404`.
- Missing TMDB configuration: `/api/tv/1399/season/1 -> 503 {"error":"TMDB_NOT_CONFIGURED"}`.
- Missing anime configuration: `CONSUMET_BASE_URL` absent.
- Provider-owned string grep: zero matches for `sandbox is not allowed` and `title not found`; one user-facing match for `Episodes could not be loaded.` in `components/landing/EpisodeShowcase.tsx`.

## 12. Accessibility

Static evidence shows a skip link, labeled main/mobile navigation, and labeled icon controls in captured HTML. A complete keyboard-only/DevTools accessibility run was not completed in this pass; therefore no stronger claim is made. Screenshots available in the page evidence directory.

## 13. Responsive

Not fully executed across all five requested viewports. The captured page screenshots are desktop 1440x900 only. Responsive claims remain unverified.

## 14. Performance

Lighthouse and DevTools CLS capture were not completed. No performance score or CLS value is claimed.

## 15. Problem register

| ID | Section | Severity | Area | Symptom | Root cause | Fix | Owner |
|---|---|---|---|---|---|---|---|
| P0-1 | 4/8 | P0 | Provider health | `/api/health/providers` is 404 HTML; SSRF/rate-limit contract cannot run | Route is absent from `app/api` | Implement JSON health route with registry-only origins, timeout, SSRF protection, and rate limiting; verify curl/`jq` and 429 behavior | Backend |
| P0-2 | 3/4/5 | P0 | Metadata/playback | TV season API returns 503 `TMDB_NOT_CONFIGURED`; search returns empty | Effective TMDB key unavailable to runtime | Configure a non-empty server-side TMDB key and verify TV/search curl responses | Release/Backend |
| P0-3 | 7 | P0 | Anime playback | Entire anime matrix blocked | `CONSUMET_BASE_URL` unset | Configure an external Consumet base URL and verify it is not the app origin | Release |
| P1-1 | 9 | P1 | CSP/provider playback | CSP frame-src omits multiple providers named in scope | Static allowlist is incomplete | Reconcile registry origins and CSP allowlist; verify each iframe with browser evidence | Frontend/Security |
| P1-2 | 9 | P1 | Provider reachability | `player.autoembed.cc` DNS failure; SmashyStream TLS principal failure; VidSrc 403 | External provider/network failures | Remove dead origins from priority or add verified fallback behavior; re-probe | Provider integration |
| P2-1 | 4/5 | P2 | Testability | Full content matrices could not be honestly populated | Missing runtime metadata and no verified force-provider contract | Add deterministic test fixtures/mocks outside production path and document query contract | QA/Frontend |

## 16. Working register

No provider is claimed as PLAYABLE. Direct HTTP 200/301 responses from provider homepages are reachability evidence only, not playable title evidence. Anime has zero verified working providers because Consumet is unset.

## 17. Recommended fixes

1. P0-1: add `app/api/health/providers/route.ts`; restrict probe targets to the provider registry, validate origin parsing, enforce a bounded timeout, and rate-limit `refresh=1`. Verify with normal JSON, `origin=https://evil.example`, and two refresh requests where the second is 429.
2. P0-2: configure `TMDB_API_KEY` in the actual dev/production runtime, then verify `/api/search` and `/api/tv/1399/season/1` return data, not 503/empty fallback.
3. P0-3: configure `CONSUMET_BASE_URL` to a reachable external service, explicitly reject self-reference, then run info/watch requests for all four providers.
4. P1-1: derive CSP `frame-src` from the same provider registry used by playback, or keep a tested synchronized allowlist. Do not loosen `frame-ancestors` or add `unsafe-eval`.
5. P1-2: classify the DNS/TLS/403 origins as unavailable and ensure fallback skips them without leaking provider-owned errors.

## 18. Verdict

**Not shippable — blocked on P0-1 missing provider-health API, P0-2 unavailable effective TMDB configuration, and P0-3 unset Consumet configuration.** No content type has an evidence-backed playable provider in this audit.
