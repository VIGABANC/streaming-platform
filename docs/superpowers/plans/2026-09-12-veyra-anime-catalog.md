# VEYRA Anime Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class Movies, Series, and Anime discovery with normalized server-side catalog adapters and truthful error states.

**Architecture:** Keep TMDB for movie/TV data and add a server-only AniList GraphQL adapter. Normalize both into shared catalog types; pages and client search consume explicit `CatalogResult` states.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-12-veyra-anime-catalog-design.md`

## Global Constraints

- API keys and server-only adapters must never enter client bundles.
- No fake content, fake availability, or unsupported playback claims.
- API failures must not render as empty rails.
- Preserve player, auth, library, Telegram, SEO, and existing movie/TV behavior unless directly required.
- Keep route params compatible with Next.js 16 async App Router APIs.

### Task 1: Add normalized catalog and AniList adapter

**Files:**
- Create: `lib/catalog-model.ts`
- Create: `lib/anilist.ts`
- Modify: `lib/catalog.ts`
- Test: `tests/unit/catalog-model.test.ts`
- Test: `tests/unit/anilist.test.ts`

- [ ] Write failing tests for canonical identities, title normalization, AniList mapping, and error mapping.
- [ ] Run focused tests and confirm they fail for missing modules/behavior.
- [ ] Implement the types, mapper, timeout, GraphQL request, and stable failure mapping.
- [ ] Run focused tests and confirm they pass.

### Task 2: Add normalized search service and anime routes

**Files:**
- Create: `lib/catalog-search.ts`
- Create: `app/anime/page.tsx`
- Create: `app/anime/[id]/page.tsx`
- Create: `components/anime/AnimeDetail.tsx`
- Modify: `app/api/search/route.ts`
- Modify: `app/search/page.tsx`
- Test: `tests/unit/catalog-search.test.ts`
- Test: `tests/e2e/anime.spec.ts`

- [ ] Write failing tests for exact-match ranking, type filters, source-aware deduplication, and anime query behavior.
- [ ] Run focused tests and confirm they fail.
- [ ] Implement the search service, anime browse/detail pages, and API response contract.
- [ ] Run focused tests and confirm they pass.

### Task 3: Update navigation, cards, filters, and states

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/MobileNav.tsx`
- Modify: `components/media/MediaCard.tsx`
- Modify: `components/media/MediaGrid.tsx`
- Modify: `components/feedback/CatalogState.tsx`
- Modify: `components/discover/DiscoverFilters.tsx`
- Modify: `app/discover/page.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/e2e/navigation.spec.ts`

- [ ] Add failing navigation and state assertions.
- [ ] Implement Anime links, labels, filters, retryable states, and accessible controls.
- [ ] Run E2E checks for desktop and mobile projects.

### Task 4: Full verification

- [ ] Run `npm run lint`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm test -- --run`.
- [ ] Run `npm run test:e2e`.
- [ ] Run `npm run build`.
- [ ] Inspect the live preview/local production routes and report any external API limitation.
