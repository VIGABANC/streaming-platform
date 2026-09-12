# VEYRA finalization review — 2026-09-12

## Executive decision

VEYRA’s cinematic identity and existing movie/TV/player surface are worth preserving. The largest product gap was taxonomy: anime was absent from navigation, browse, search normalization, detail pages, and source-state messaging. This pass closes that discovery gap with a server-only AniList adapter, optional Jikan episode enrichment, normalized catalog types, explicit partial/failure states, and responsive Anime routes.

The project is locally buildable and statically verified. External playback is still provider-controlled and is not claimed as verified by VEYRA.

## Repository review

Reviewed:

- `AGENTS.md`, `README.md`, `AUDIT_REPORT.md`, and `docs/audit/*`
- existing App Router routes and shared layout/navigation components
- TMDB, catalog, player, library, auth, Telegram, SEO, and image configuration
- unit and Playwright test suites
- current Vercel deployment behavior at `https://streaming-platform-beryl.vercel.app`

Important existing constraints retained:

- TMDB remains the movie/TV metadata source.
- Auth, library/watchlist, Telegram, SEO, and the opaque external player shell were not rewritten.
- VEYRA does not claim to host, control, or verify third-party playback quality.
- A missing TMDB key still produces an explicit configuration warning during build; the build does not fail.

## Implemented in this pass

### Taxonomy and UX

- Added first-class Anime navigation to desktop and mobile navigation.
- Added `/anime` browse route with airing, completed, upcoming, hiatus, format, genre, and top-rated filters.
- Added `/anime/[id]` detail route with titles, alternative names, studios, format, score, release date, status, episodes, related titles, and recommendations.
- Made card labels consistent: Movie, Series, Anime.
- Added anime-specific search results and a distinct Anime tab.
- Added URL-persistent search filters for year, language, country, genre, and anime status.
- Added explicit partial-source messaging and a separate retry state when a source fails.
- Added anime metadata attribution and truthful “View Episodes” behavior instead of an unsupported play claim.

### Architecture

- Added normalized catalog types in `lib/catalog-model.ts` for media items, anime details, seasons, and episodes.
- Added `lib/anilist.ts` as a server-side AniList GraphQL adapter.
- Added `lib/jikan.ts` as optional server-side episode enrichment.
- Added `lib/catalog-search.ts` for source aggregation, canonical deduplication, and exact-title ranking.
- Added `lib/provider-http.ts` for bounded provider requests.
- Added stable catalog failure mapping for configuration, rate limit, network, invalid response, not found, and unknown failures.
- Added AniList image allow-listing and CSP support in `next.config.mjs`.

### Tests and documentation

- Added unit coverage for canonical IDs, title normalization, AniList mapping, Jikan mapping/failures, search deduplication/ranking, and AniList failure mapping.
- Added Playwright coverage for Anime navigation, browse filters, and separate Anime search results.
- Added the design spec and implementation plan under `docs/superpowers/`.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test -- --run` | Pass — 29 files, 131 tests |
| `npm run build` | Pass — `/anime` and `/anime/[id]` generated |
| `npm run test:e2e` | Environment-blocked before launch |

Playwright could not launch because its pinned Chromium executable was absent. Installing it timed out against the restricted Playwright CDN. No E2E assertion ran, so desktop/mobile visual verification remains a required environment follow-up.

## External source limitations

- AniList supplies normalized anime metadata, titles, relations, recommendations, status, format, studios, scores, and release information through GraphQL. See the [AniList API documentation](https://anilist.gitbook.io/anilist-apiv2-docs).
- Jikan is used only for optional episode enrichment. Its availability, rate limits, and episode coverage are external dependencies. See the [Jikan API documentation](https://docs.api.jikan.moe/).
- TMDB remains required for the existing movie/TV catalog and search. The [TMDB API documentation](https://developer.themoviedb.org/docs) should be used to configure production credentials.
- Provider availability and playback still depend on the existing third-party provider surface; VEYRA cannot locally verify playback quality or rights.

## Three finalization goals

### Goal 1 — Finish the catalog contract

> Finalize VEYRA’s unified catalog contract for Movies, Series, Anime, Anime Movies, Anime Series, Ongoing/Airing, Completed, Upcoming, Specials, Seasons, and Episodes. Audit every route and component so pages consume normalized domain services only, add provider adapters with timeout/rate-limit/cache/error contracts, and add fixture-backed tests for success, empty, partial, not-found, rate-limited, and unavailable states. No provider-specific response shape may leak into UI code.

### Goal 2 — Finish discovery UX and accessibility

> Finalize the VEYRA discovery experience across desktop and mobile. Make Movies, Series, and Anime immediately distinct in navigation, cards, search tabs, filters, detail metadata, season/episode navigation, and CTA capability states. Verify debounced keyboard-accessible search, exact-match ranking, canonical deduplication, URL filter persistence, accessible filter drawers, loading/empty/offline/error/retry states, screen-reader announcements, responsive layout, and truthful availability language with Playwright visual and interaction coverage.

### Goal 3 — Finish production reliability and player trust

> Finalize VEYRA for production without weakening trust. Verify Vercel build/runtime behavior, secret isolation, CSP, image domains, caching, rate limiting, observability, SEO/sitemap, auth/library persistence, Telegram flows, and the existing multi-server player. Keep server selection, timeout, failover, offline/reconnect, and provider availability states deterministic; never imply playback or quality is verified when it is not. Run lint, typecheck, unit, E2E, accessibility, mobile/desktop, and production smoke checks, then ship only with documented external API and provider limitations.

