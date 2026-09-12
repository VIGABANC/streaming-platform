# VEYRA Anime Catalog Design

**Goal:** Add first-class Movies, Series, and Anime discovery without leaking provider-specific response shapes into the UI or converting upstream failures into empty content.

**Architecture:** Keep TMDB as the movie/TV adapter and add a server-only AniList GraphQL adapter for anime metadata. Normalize both into a small catalog model, then let pages and client search consume typed catalog results with explicit success, empty, partial, and failure states.

**Scope:** Catalog/search/anime only. Player, auth, library, Telegram, and Supabase persistence remain unchanged.

**Constraints:** API keys remain server-only; anime must work without a secret key; no fake playback or availability claims; failures must be visible and retryable; existing routes and tests must remain compatible.

## Domain model

- `MediaItem`: canonical id, source ids, media kind, title set, synopsis, artwork, score, dates, genres, language, and source attribution.
- `Movie`: `MediaItem` with `kind: 'movie'`.
- `Series`: `MediaItem` with `kind: 'series'`, seasons and episode counts.
- `Anime`: `MediaItem` with `kind: 'anime'`, format, status, studios, episodes, airing schedule, and related titles.
- `Season` and `Episode`: normalized season/episode navigation records.
- `Person` and `Collection`: typed placeholders for future detail relationships, not required for this slice.

TMDB IDs and AniList IDs are retained as source IDs; canonical identity is `source:kind:id`, so records from separate APIs cannot silently collide.

## Data flow

`page/client → catalog service → adapter → normalized CatalogResult`.

The anime adapter calls AniList's official GraphQL endpoint from the server. The adapter has a timeout, bounded response validation, and stable error mapping. Search merges normalized TMDB and AniList results, deduplicating only within a source and keeping source identity visible.

## UX

Add Anime to desktop/mobile navigation, add `/anime`, add `/anime/[id]`, and add Anime search filtering. Cards use `Movie`, `Series`, or `Anime` labels. Detail pages show original/English/alternative titles, studios, format, episode count, status, dates, score, genres, relations, recommendations, and source attribution. API failure, empty results, and offline states are distinct.

## Testing

Unit tests cover domain normalization, AniList mapping, canonical identity, search ranking, deduplication, and failure mapping. E2E tests cover navigation, anime search, anime detail, filters, and empty/error states. Existing player/auth/Telegram tests remain part of the full suite.
