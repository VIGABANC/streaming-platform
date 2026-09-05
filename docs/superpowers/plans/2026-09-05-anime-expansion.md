# VEYRA Anime Expansion Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

Goal: Add an AniList-first anime discovery experience to VEYRA while preserving TMDB as the movie/TV/provider backbone and keeping Jikan and Watchmode optional.

Architecture: Add server-side typed adapters for AniList, Jikan, Watchmode, and source-aware media normalization. Build /anime and /anime/[id] with the existing VEYRA shell, then extend search and library identity without mixing provider IDs. Keep every external source independently cached and failure-safe.

Tech Stack: Next.js 16 App Router, React 19, TypeScript, server-side fetch with next.revalidate, Vitest, Playwright, TMDB, AniList GraphQL, optional Jikan REST, optional Watchmode REST, official YouTube iframe embeds.

Spec: docs/superpowers/specs/2026-09-05-anime-expansion-design.md

## Global Constraints

- TMDB remains the movie/TV/provider backbone.
- AniList is the primary anime metadata source.
- Jikan is detail-only optional enrichment and never a rail dependency.
- Watchmode is optional and must never block TMDB provider availability.
- YouTube usage is official embed-only; no scraping, downloading, proxying, or stream extraction.
- Do not add paid video infrastructure or scraping-based anime streaming.
- Keep secrets server-side; optional-service credentials are never public.
- Do not issue one enrichment request per poster/card.
- Preserve existing movie/TV library records and source identity.
- Use Server Components, cached fetches, responsive next/image, and small client boundaries.
- All new routes need stable error/loading states, SEO, keyboard accessibility, reduced-motion behavior, and 390x844 coverage.
- Use deterministic mocks for acceptance E2E; tests must not depend on live API quota.

---

### Task 1: Source-aware media contracts and library migration

Files:
- Create lib/media/types.ts and lib/library/migration.ts.
- Modify lib/library/types.ts, lib/library/local-repository.ts, and lib/store.ts.
- Test tests/unit/media-types.test.ts and tests/unit/library-migration.test.ts.

Interfaces:
- MediaSource is tmdb or anilist.
- MediaKind is movie, tv, or anime.
- MediaRef contains source, sourceId, and kind.
- sourceKey(ref, episode?) returns a collision-safe library key.
- migrateLibrarySnapshot(value) reads version-1 snapshots and returns version 2.

Steps:
- [ ] Write failing tests proving TMDB movie 123 and AniList anime 123 have different keys, malformed source values are rejected, and episode/season identity is included.
- [ ] Write failing migration tests proving version-1 movie/TV snapshots remain intact and gain explicit TMDB source/kind fields.
- [ ] Implement the contracts and migration without widening the existing TMDB model with AniList-only fields.
- [ ] Update local import/export and merge logic to accept version-2 anime items while preserving existing callers.
- [ ] Run npm test -- --run tests/unit/media-types.test.ts tests/unit/library-migration.test.ts tests/unit/library-merge.test.ts and npm run typecheck.
- [ ] Commit feat: add source-aware media and library contracts.

---

### Task 2: AniList GraphQL adapter

Files:
- Create lib/anilist/types.ts, lib/anilist/queries.ts, lib/anilist/client.ts, and lib/anilist/index.ts.
- Test tests/unit/anilist-client.test.ts and tests/unit/anilist-normalize.test.ts.

Interfaces:
- AnimeListItem and AnimeDetail normalized types.
- AniListErrorCode covers network, invalid response, rate limit, and not found failures.
- searchAnime(query, page), getTrendingAnime(), getAiringAnime(), getSeasonAnime(year, season), getTopAnime(), and getAnimeDetail(id).

Steps:
- [ ] Mock global.fetch and write failing tests for POST GraphQL requests, operation variables, invalid-ID rejection, GraphQL error normalization, and timeout behavior.
- [ ] Add list/detail fixtures and failing normalization tests for title fallback, HTTPS artwork URLs, descriptions, studios, relations, capped characters/staff, and future-only airing events.
- [ ] Implement anilistQuery with an 8-second timeout, response-size guard, stable errors, and next.revalidate.
- [ ] Keep list queries lightweight; request rich fields only from the detail query. Use 900 seconds for list cache, 300 seconds for airing, and 21600 seconds for details.
- [ ] Run focused tests without network access.
- [ ] Commit feat: add cached AniList anime adapter.

---

### Task 3: Optional Jikan and Watchmode adapters

Files:
- Create lib/jikan/client.ts, lib/jikan/types.ts, lib/watchmode/client.ts, and lib/watchmode/types.ts.
- Modify .env.example.
- Create docs/anime-data-sources.md and tests/unit/optional-anime-services.test.ts.

Interfaces:
- getJikanEnrichment(malId) returns JikanEnrichment or null.
- getWatchmodeLinks(input) returns disabled, unavailable, or success with normalized ProviderLink values.

Steps:
- [ ] Write tests proving missing Watchmode configuration performs no request, Watchmode 401/429/network errors return unavailable, and Jikan failure returns null.
- [ ] Implement Jikan detail-only enrichment with revalidate 86400, bounded timeout, and MAL score/rank/popularity normalization.
- [ ] Implement Watchmode behind server-only WATCHMODE_API_KEY, with revalidate 21600, quota handling, and no home-page calls.
- [ ] Document AniList to TMDB to Jikan enrichment and TMDB to Watchmode link precedence.
- [ ] Run focused tests.
- [ ] Commit feat: add optional Jikan and Watchmode enrichment.

---

### Task 4: Conservative AniList-to-TMDB mapping

Files:
- Create lib/media/mapping.ts and tests/unit/media-mapping.test.ts.
- Modify lib/tmdb.ts only if a bounded search helper is required.

Interfaces:
- mapAnimeToTMDB(anime) returns MediaMapping or null.
- getAnimeProviderAvailability(anime, region) returns a CatalogResult of WatchProviderRegion.

Steps:
- [ ] Add failing fixtures for explicit external-ID matches, exact title/year matches, wrong type/year, ambiguity, and no-match.
- [ ] Implement explicit-ID matching first, then exact normalized title plus compatible year/type. Return null for ambiguity or low confidence.
- [ ] Cache successful mappings for 21600 seconds and only expose provider availability for high-confidence mappings.
- [ ] Reuse the existing region-aware TMDB Watch Providers helper; never present availability as universal.
- [ ] Run npm test -- --run tests/unit/media-mapping.test.ts.
- [ ] Commit feat: map anime to TMDB conservatively.

---

### Task 5: Shared anime UI primitives

Files:
- Create components/anime/AnimeCard.tsx, AnimeRail.tsx, AnimeHero.tsx, AnimeMeta.tsx, AnimeFailureState.tsx, AiringBadge.tsx, AnimeRelationCard.tsx, AnimeCharacters.tsx, AnimeStudios.tsx, and AnimeTrailer.tsx.

Interfaces:
- Components consume normalized AniList application types.
- AiringBadge renders only a future timestamp.
- AnimeTrailer accepts a YouTube video ID and uses the existing official embed/modal pattern.
- All links preserve source-aware AniList IDs.

Steps:
- [ ] Implement card/meta primitives with existing VEYRA surfaces, next/image, responsive sizes, alt text, focus rings, and reduced-motion classes.
- [ ] Implement hero/airing display with title fallback, format, score, episode count, status, genres, and description.
- [ ] Implement relations, primary characters/studios/staff, and official trailer display with explicit relation labels.
- [ ] Run npm run typecheck and npm run lint.
- [ ] Commit feat: add VEYRA anime presentation primitives.

---

### Task 6: Anime discovery and detail routes

Files:
- Create app/anime/page.tsx, app/anime/[id]/page.tsx, app/anime/loading.tsx, and app/anime/[id]/loading.tsx.
- Create tests/unit/anime-routes.test.ts and tests/e2e/anime.spec.ts.

Interfaces:
- /anime runs list queries in parallel and renders partial rail states.
- /anime/[id] validates a positive AniList ID and calls getAnimeDetail.
- Detail metadata uses canonical /anime/{id} and the existing safe JSON-LD serializer.

Steps:
- [ ] Mock adapters and write failing tests for list-only calls, malformed IDs, missing detail data, relation labels, and independent optional-service failures.
- [ ] Implement /anime with Anime Hero, Trending, Airing Now, New This Season, Top Rated, Anime Movies, Popular, and one useful studios section.
- [ ] Implement /anime/[id] with core AniList detail first, optional Jikan/mapping/provider enrichment second, and independent unavailable states.
- [ ] Add generateMetadata, Open Graph artwork, and safe TVSeries/Movie structured data where the format supports it.
- [ ] Add deterministic Playwright coverage for desktop and 390x844 discovery, airing, detail, relations, characters, provider fallback, no console errors, and no document overflow.
- [ ] Run focused unit/E2E tests.
- [ ] Commit feat: add anime discovery and detail routes.

---

### Task 7: Navigation and home Anime Signal

Files:
- Modify components/layout/Header.tsx, components/layout/MobileNav.tsx, and app/page.tsx.
- Create components/anime/AnimeSignalRail.tsx.
- Modify tests/e2e/home.spec.ts and tests/e2e/navigation.spec.ts.

Steps:
- [ ] Add failing assertions for desktop Anime navigation, mobile Anime navigation at 390x844, one home Anime Signal rail, and TMDB content surviving AniList failure.
- [ ] Add Anime to desktop navigation and use the mobile order Home, Movies, TV, Anime, My List while keeping Discover reachable elsewhere.
- [ ] Add exactly one lightweight home rail calling only trending Anime; never call detail/Jikan/Watchmode from home.
- [ ] Run the focused Playwright tests with one worker.
- [ ] Commit feat: surface anime in VEYRA navigation and home.

---

### Task 8: Unified source-aware search

Files:
- Create lib/search/types.ts, lib/search/normalize.ts, and lib/search/service.ts.
- Modify app/api/search/route.ts and app/search/page.tsx.
- Test tests/unit/search-normalization.test.ts, tests/integration/search.test.ts, and tests/e2e/search.spec.ts.

Interfaces:
- SearchScope is all, movie, tv, or anime.
- MediaSearchResult contains MediaRef, title, originalTitle, year, artwork, rating, popularity, and optional sourceFields.
- Route format is /api/search?query=bounded-query&scope=scope.
- all runs TMDB multi-search and AniList search concurrently; narrow scopes call only their owning source.

Steps:
- [ ] Add failing tests for scope validation, mixed-source normalization, source-aware links, AniList failure with TMDB results preserved, and Jikan never being called.
- [ ] Implement normalizers and bounded concurrent orchestration. Keep existing query length, rate limit, redacted logging, debounce, cancellation, and URL persistence.
- [ ] Add accessible All, Movies, TV Shows, and Anime tabs and source labels without changing existing movie/TV result behavior.
- [ ] Run unit, integration, and E2E search tests.
- [ ] Commit feat: add source-aware anime search.

---

### Task 9: Shared library support for anime

Files:
- Modify lib/store.ts, lib/library/types.ts, lib/library/local-repository.ts, lib/library/cloud-repository.ts, components/library/LibrarySync.tsx, components/media/MediaDetailActions.tsx, and app/my-list/page.tsx.
- Test tests/unit/anime-library.test.ts and tests/e2e/watchlist.spec.ts.

Steps:
- [ ] Write failing tests proving Anime ID 123 does not collide with TMDB movie ID 123, version-1 data survives export/import, and anime entries merge by source-aware key.
- [ ] Add source-aware watchlist/favorite/history helpers while keeping existing movie/TV callers valid.
- [ ] Update detail actions and My List routing so anime entries link to /anime/{sourceId}.
- [ ] Add mocked Anime to Watchlist to My List to Anime detail E2E coverage on desktop/mobile.
- [ ] Run focused tests.
- [ ] Commit feat: support anime in the shared library.

---

### Task 10: SEO, sitemap, accessibility, and mobile verification

Files:
- Modify app/sitemap.ts and app/robots.ts only when required.
- Create tests/unit/anime-seo.test.ts and docs/anime-accessibility-checklist.md.
- Modify tests/e2e/anime.spec.ts.

Steps:
- [ ] Write failing tests for /anime and detail metadata, canonical URLs, Open Graph artwork, safe JSON-LD, bounded sitemap entries, and exclusion of private/search routes.
- [ ] Implement metadata and add /anime plus bounded known anime detail URLs without enumerating AniList.
- [ ] Verify relation links, trailer modal, airing states, card alt text, keyboard focus, reduced motion, touch targets, and no 390x844 document overflow.
- [ ] Run targeted tests.
- [ ] Commit feat: finish anime SEO and accessibility coverage.

---

### Task 11: Fresh production verification and release evidence

Files:
- Create or modify docs/anime-release-checklist.md, README.md, and REMEDIATION_REPORT.md.

Steps:
- [ ] Use rg to verify no paid video SDK, scraper API, raw UI-level third-party fetch, or client-visible optional credential was added.
- [ ] Run fresh npm ci, npm run typecheck, npm run lint, npm test -- --run, npm run build, npm run test:e2e, and npm audit --omit=dev.
- [ ] Start the production build with placeholders and smoke-test /, /anime, /anime/1, /search?scope=anime&q=..., /robots.txt, and /sitemap.xml; capture statuses, console errors, network failures, and overflow.
- [ ] Document exact counts, cache/failure evidence, optional-service fallback evidence, and required Vercel environment variables.
- [ ] Commit docs: record anime expansion verification.

## Final review checklist

- [ ] TMDB movie/TV/provider behavior is unchanged and tested.
- [ ] AniList powers working /anime and /anime/[id] with airing, relations, characters, studios, recommendations, and source-aware links.
- [ ] Anime search and shared library work without breaking movie/TV data.
- [ ] Jikan and Watchmode are optional and failure-safe.
- [ ] YouTube is official embed-only.
- [ ] No paid video infrastructure or scraping is present.
- [ ] Caching, bounded requests, and failure isolation are covered by tests.
- [ ] SEO, accessibility, mobile, and E2E checks pass.
- [ ] Fresh typecheck, lint, tests, build, E2E, audit, and runtime smoke checks pass.

