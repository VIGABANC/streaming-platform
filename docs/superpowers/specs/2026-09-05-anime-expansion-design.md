# VEYRA Anime Expansion Design

## Goal

Expand VEYRA with a first-class, AniList-powered anime experience while preserving TMDB as the movie/TV/provider backbone, keeping optional services non-critical, and maintaining VEYRA's existing cinematic shell, library, accessibility, and performance standards.

## Scope and non-goals

### In scope

- AniList GraphQL adapter for anime discovery and detail metadata.
- \`/anime\` discovery and \`/anime/[id]\` detail routes.
- Airing schedules, relations, characters, staff, studios, recommendations, trailers, and source-aware metadata.
- Anime-aware shared library items.
- Unified search with All, Movies, TV, and Anime scopes.
- Conservative AniList-to-TMDB mapping for provider availability.
- Optional Jikan MAL enrichment and optional Watchmode provider-link enrichment.
- Bounded caching, request validation, independent error states, SEO, accessibility, mobile behavior, and deterministic tests.

### Explicitly out of scope

- Paid video hosting or media infrastructure.
- Scraping-based anime streaming or reverse-engineered mirrors.
- Replacing TMDB for movies, TV, or provider availability.
- A client-side GraphQL state layer or a second anime application shell.
- Kitsu integration unless a later evidence-backed gap remains.
- AI-generated recommendations.

## Product architecture

VEYRA will expose one shared discovery experience with source-aware media records:

\`\`\`text
TMDB      -> movies, TV, trending, metadata, trailers, provider availability
AniList   -> anime discovery, rich anime metadata, airing, relations
Jikan     -> optional MAL score/rank/popularity enrichment on anime detail
Watchmode -> optional provider destination enrichment when configured
YouTube   -> official trailer embeds only
\`\`\`

TMDB remains the only required catalog credential. AniList is a public API but is accessed through a server-side adapter so responses can be cached, shaped, and failure-isolated. Jikan and Watchmode are never required for a page to render.

## Data boundaries

### Adapter modules

Create focused provider modules:

- \`lib/anilist/client.ts\` — GraphQL transport, timeout, bounded response size, error normalization, and \`next.revalidate\` fetch caching.
- \`lib/anilist/queries.ts\` — small list queries and rich detail queries.
- \`lib/anilist/types.ts\` — raw GraphQL response types and normalized anime types.
- \`lib/anilist/index.ts\` — public adapter functions used by routes.
- \`lib/jikan/client.ts\` — detail-only optional enrichment with cache and a failure-safe result type.
- \`lib/watchmode/client.ts\` — optional provider-link enrichment behind \`WATCHMODE_API_KEY\`; no key means a typed \`disabled\` result.
- \`lib/media/types.ts\` — source-aware application-level result types.
- \`lib/media/mapping.ts\` — conservative AniList/TMDB mapping with confidence and explicit source IDs.

UI components must consume normalized application types rather than raw GraphQL, Jikan, or Watchmode payloads.

### Source-aware identifiers

Every cross-source item uses an explicit identifier:

\`\`\`ts
type MediaSource = 'tmdb' | 'anilist'
type MediaKind = 'movie' | 'tv' | 'anime'

interface MediaRef {
  source: MediaSource
  sourceId: number
  kind: MediaKind
}
\`\`\`

An AniList ID must never be passed to a TMDB detail or provider endpoint without a successful mapping record.

### Normalized anime types

The adapter produces separate list and detail shapes to prevent oversized homepage payloads:

\`\`\`ts
interface AnimeListItem extends MediaRef {
  source: 'anilist'
  kind: 'anime'
  title: string
  originalTitle?: string
  romajiTitle?: string
  year?: number
  season?: string
  format?: 'TV' | 'TV_SHORT' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC'
  status?: string
  episodes?: number
  score?: number
  popularity?: number
  posterUrl?: string
  bannerUrl?: string
  description?: string
}

interface AnimeDetail extends AnimeListItem {
  japaneseTitle?: string
  durationMinutes?: number
  genres: string[]
  tags: Array<{ id: number; name: string; rank?: number }>
  studios: Array<{ id: number; name: string; isMain: boolean }>
  airing?: {
    status?: string
    nextEpisode?: number
    nextAiringAt?: string
  }
  characters: Array<{ id: number; name: string; imageUrl?: string; role?: string; voiceActor?: string }>
  staff: Array<{ id: number; name: string; role: string; imageUrl?: string }>
  relations: Array<{ relation: string; media: AnimeListItem }>
  recommendations: AnimeListItem[]
  trailer?: { site: 'youtube'; videoId: string; thumbnailUrl?: string }
  externalIds?: { malId?: number }
}
\`\`\`

Fields absent from AniList remain absent in the UI. In particular, no airing countdown is rendered without a future \`nextAiringAt\` timestamp.

## Routes and experience

### \`/anime\`

Use the existing \`Shell\`, typography, surfaces, rails, \`MediaCard\` patterns, loading states, and \`CatalogState\` components. The page fetches list-shaped queries in parallel and renders:

1. one data-backed anime hero;
2. Trending Anime;
3. Airing Now;
4. New This Season;
5. Top Rated Anime;
6. Anime Movies;
7. one Popular Anime rail;
8. one studios/collections section only when data makes it useful.

The page must render independent rail failures instead of turning AniList failure into an empty catalog. It must not request detail-only fields for rail cards.

### \`/anime/[id]\`

The detail route uses AniList ID validation and \`getAnimeDetail\`. It shows the hero, metadata, airing information, provider availability when a conservative TMDB mapping exists, official trailer, relations, recommendations, primary characters, studios, and selected staff. Characters and staff are capped to a small primary set; there is no hundreds-of-records default payload.

Relation labels are rendered explicitly, including Prequel, Sequel, Side Story, Spin-Off, Alternative, Adaptation, and Parent Story when supplied. Each relation links to \`/anime/[anilistId]\`.

### Navigation

Add Anime to desktop navigation. On mobile, replace or reorder the current five-item mobile navigation only if the resulting labels remain readable and touch targets remain at least the existing size. The preferred mobile order is Home, Movies, TV, Anime, My List; Discover remains reachable from the header or anime/search surfaces.

## Anime-to-TMDB mapping and provider availability

Mapping is conservative and server-side. The mapper may use an explicit external ID when available; otherwise it compares normalized title candidates, year, format, and season/type. It returns:

\`\`\`ts
interface MediaMapping {
  anilistId: number
  tmdbId: number
  tmdbKind: 'movie' | 'tv'
  confidence: 'high' | 'medium'
  matchedBy: 'external-id' | 'title-year'
}
\`\`\`

Only \`high\` confidence mappings may surface provider availability by default. The existing region-aware TMDB Watch Providers implementation remains the source of truth. The active region must be passed explicitly and never be presented as universal availability. Watchmode may add destination links but cannot replace or block TMDB results.

## Unified search

Replace the current TMDB-only filter model with:

\`\`\`ts
type SearchScope = 'all' | 'movie' | 'tv' | 'anime'
\`\`\`

The route handler accepts a bounded query and scope. \`all\` runs TMDB multi search and AniList anime search concurrently, while the narrower scopes call only their owning source. Results normalize to:

\`\`\`ts
interface MediaSearchResult {
  ref: MediaRef
  title: string
  originalTitle?: string
  year?: number
  posterUrl?: string
  backdropUrl?: string
  rating?: number
  popularity?: number
  sourceFields?: Record<string, unknown>
}
\`\`\`

The UI uses one renderer with source-aware links. It must not issue one Jikan request per search result, and it must preserve existing movie/TV search behavior when AniList is unavailable.

## Library compatibility

Extend the existing local/cloud snapshot schema to version 2 with a source-aware item shape. Existing records without \`source\` are treated as TMDB records and remain readable. Anime records store \`source: 'anilist'\`, \`kind: 'anime'\`, and the AniList \`sourceId\`; provider mapping metadata is optional and never used as the primary identity.

The merge key becomes source + kind + source ID plus season/episode where applicable. The current deterministic newest-timestamp merge behavior remains. Add import/export migration tests proving version-1 movie/TV data is preserved.

## Optional services

### Jikan

Jikan is called only on an anime detail route when the MAL enrichment flag is enabled and the normalized AniList detail lacks the requested field. It is cached, timeout-bounded, and returns \`null\` on failure. No list rail calls Jikan.

### Watchmode

\`WATCHMODE_API_KEY\` is server-only. The adapter returns \`disabled\` when absent, and \`unavailable\` for quota/network/provider errors. The UI renders TMDB availability in both cases and may render Watchmode links only for successful enrichment. No Watchmode request is made on the home page.

### YouTube

Anime trailers use the existing official trailer modal/embed pattern. The application stores only the YouTube video ID and embeds the official player; it does not scrape, download, proxy, or extract streams.

## Caching and failure isolation

- AniList list queries: \`revalidate: 900\`.
- AniList detail queries: \`revalidate: 21600\`.
- Airing queries: \`revalidate: 300\`.
- Jikan enrichment: \`revalidate: 86400\`.
- Mapping/provider lookup: \`revalidate: 21600\`.
- Watchmode enrichment: \`revalidate: 21600\`, never user-specific.

All adapters use typed stable error categories. A provider failure renders a local unavailable state and does not fail unrelated TMDB or library surfaces. Request paths validate positive IDs and bounded scope/query values. Search is debounced in the client and rate-limited server-side; no per-card N+1 anime requests are allowed.

## SEO, accessibility, and mobile

- \`/anime\` receives title, description, canonical, Open Graph image, and \`CollectionPage\`/item structured data where supported.
- \`/anime/[id]\` receives data-backed title, description, canonical, poster or banner Open Graph image, and safe \`TVSeries\`/\`Movie\`-appropriate anime structured data without unsafe script interpolation.
- Sitemap includes \`/anime\` and a bounded set of known anime detail URLs only; it does not enumerate the AniList universe.
- New controls use labelled buttons, keyboard focus, reduced-motion handling, alt text, visible focus, and touch targets matching existing VEYRA standards.
- Mobile verification covers 390×844 for anime home, detail, search, relations, characters, and provider availability with no document-level overflow.

## Testing strategy

Add deterministic unit tests for:

- AniList GraphQL request shaping and response normalization.
- invalid AniList IDs and stable error mapping.
- search-scope routing and mixed-source normalization.
- airing event omission when no future event exists.
- relation/studio/character normalization and caps.
- conservative TMDB mapping confidence.
- Jikan failure and Watchmode missing-key/quota fallback.
- version-1 library migration and anime merge keys.
- anime metadata, canonical, JSON-LD, and sitemap policy.

Add mocked Playwright flows for:

- Home → Anime Signal → Anime detail.
- Anime → Airing → Anime detail.
- Search → Anime → result.
- Anime → provider availability.
- Anime → Watchlist → My List.
- mobile anime navigation and relations.

External API mocks must be deterministic and should not make the acceptance suite depend on live API quotas. Run fresh typecheck, lint, unit tests, build, E2E, dependency audit, and a production runtime smoke check before completion.

## Acceptance gates

The feature is complete only when:

- TMDB remains the movie/TV/provider backbone.
- AniList powers working \`/anime\` and \`/anime/[id]\` routes with airing, relations, characters, studios, recommendations, and source-aware links.
- Anime search and shared library support work without breaking movie/TV data.
- Jikan and Watchmode are optional and failure-safe.
- YouTube usage is official embed-only.
- No paid video or scraping infrastructure is added.
- Caching, bounded requests, and failure isolation are covered by tests.
- SEO, accessibility, mobile, and E2E checks pass.
- All fresh verification commands pass.

