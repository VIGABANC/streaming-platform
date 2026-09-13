# VEYRA Resource and API Adapter Design

**Date:** 2026-09-13  
**Status:** Approved design baseline
**Scope:** Metadata, catalog enrichment, availability metadata, subtitles, and provider inventory

## Goal

Add every resource identified in the Telegram discussion to a single, typed VEYRA resource registry while enabling only sources that are technically and legally verifiable for the requested product use.

## Non-negotiable boundaries

- The Telegram group `t.me/vidsrc_sbs` is treated as an unverified community reference, not as proof of ownership, authorization, uptime, or legality.
- Metadata and availability are separate from playback. An availability result says where a title may be available; it is not a playable source.
- No scraper, wrapper, embed host, proxy, or arbitrary URL builder may become an active VEYRA playback provider without documented authorization and a technical verification record.
- Anime remains `unavailable` for playback when no authorized direct-media or verified provider source exists.
- Server-side secrets never reach browser bundles, logs, URLs, or client-visible error messages.
- No fake quality, subtitle, audio-track, bitrate, or playback-verified claims are permitted.

## Resource inventory policy

Each resource gets one registry record with `category`, `sourceKind`, `authorizationStatus`, `runtimePolicy`, `supportedMedia`, and `attribution`. `runtimePolicy` is one of `active`, `fallback`, `optional`, or `documentation-only`.

Playback providers additionally require an explicit verification record before they can be enabled:

```ts
interface PlaybackProviderVerification {
  providerId: string
  authorizationEvidence: string[]
  originChecks: string[]
  allowedEmbeddingContexts: ('same-origin' | 'cross-origin-iframe' | 'native-media')[]
  lastVerifiedAt: string | null
  verificationMethod: 'manual-review' | 'automated-smoke' | 'provider-documentation'
  riskNotes: string[]
  enabled: boolean
}
```

`enabled` defaults to `false`. The playback registry rejects a provider without a current verification record, allowed embedding context, origin checks, and authorization evidence. A health check alone can never turn an unverified provider on.

| Resource | Category | Runtime policy | VEYRA use | Reason/status |
|---|---|---:|---|---|
| TMDB API | Movie/TV metadata | active | Primary movies and TV metadata, recommendations, credits, seasons, episodes | Existing server-side source; requires server key |
| TMDB Watch Providers | Availability metadata | active | Country-aware streaming/rent/buy availability metadata | Availability only; never treated as playback |
| AniList GraphQL | Anime metadata | active | Anime search, details, titles, genres, status, relations, recommendations | Existing server-side source |
| Jikan | Anime enrichment | active/fallback | Anime episode metadata and MAL enrichment | Existing server-side source; bounded requests |
| TVmaze | TV metadata | fallback | TV show/episode/calendar fallback when the authoritative catalog is incomplete | Keyless public API; rate-limited and cached |
| Kitsu | Anime enrichment | fallback | Alternative titles, mappings, relationships, and catalog cross-checks | JSON:API; bounded pagination and cached requests |
| OpenSubtitles REST | Subtitle metadata | optional | Search and display subtitle availability when feature is enabled | Server-side credentials; no video proxy or ownership claim |
| OMDb API | Metadata fallback | documentation-only | Keep in research notes; no implementation in this scope | Reconsider only after a measured catalog gap and documented key/usage policy |
| JustWatch Partner API | Availability metadata | documentation-only | Document as a future licensed partner integration | Partner token/contract required; no scraping or private endpoint use |
| VidSrc.sbs | Streaming/embed | documentation-only | Keep in provider verification matrix | Unverified opaque third-party source; no active playback |
| `vidsrc.ts` | Streaming wrapper/scraper | documentation-only | Record as rejected integration candidate | Does not establish authorization or source reliability |
| `vidsrc-api-v2` | Streaming wrapper | documentation-only | Record as rejected integration candidate | Hosted scraper/API; no verified rights or SLA |
| `svidsrc-api` | Streaming wrapper/scraper | documentation-only | Record as rejected integration candidate | Same authorization and stability limitation |
| Consumet | Streaming/scraping framework | documentation-only | Record as rejected integration candidate | Aggregates/scrapes third-party sources; not a verified provider |
| `anime-sdk` | Anime streaming wrapper | documentation-only | Record as rejected integration candidate | SDK does not prove source authorization |
| Dramacool API | Streaming/scraping | documentation-only | Record as rejected integration candidate | Unverified third-party extraction source |
| Megaplay API | Streaming/scraping | documentation-only | Record as rejected integration candidate | Unverified third-party extraction source |
| hianime-api | Anime streaming/scraping | documentation-only | Record as rejected integration candidate | Unverified third-party extraction source |
| AniProject | Anime streaming/scraping | documentation-only | Record as rejected integration candidate | Unverified third-party extraction source |
| VidSrc.xyz / VidSrc Wiki / 2Embed / AutoEmbed | Embed playback | documentation-only | Existing provider records and health matrix only | Opaque, non-verified embeds; UI says provider-controlled/frame-loaded only |
| YouTube subtitles API tools | Subtitle extraction | documentation-only | Document for evaluation only | Scope and rights vary; no automatic extraction/proxying |
| `jianying-subtitle` | Subtitle/transcription tool | documentation-only | Document for evaluation only | Not a general licensed subtitle catalog |
| Kurozora Embed Code Generator / Microlink | Embed/tooling | documentation-only | Document as a tooling reference only | Does not create an authorized playback source |

## Architecture

### Normalized resource contracts

Add a catalog-provider boundary under `lib/catalog-providers/`. Adapters must return domain data rather than upstream response shapes:

```ts
type CatalogProviderStatus =
  | 'success'
  | 'empty'
  | 'partial'
  | 'not-found'
  | 'rate-limited'
  | 'unavailable'
  | 'invalid'

type CatalogProviderErrorCode =
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_NETWORK_ERROR'
  | 'PROVIDER_AUTH_FAILED'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UPSTREAM_ERROR'
  | 'PROVIDER_INVALID_RESPONSE'
  | 'SUBTITLES_NOT_CONFIGURED'
  | 'SUBTITLES_QUOTA_EXHAUSTED'

interface CatalogProviderResult<T> {
  providerId: string
  status: CatalogProviderStatus
  data: T | null
  errorCode?: string
  retryAfterSeconds?: number
  attribution: string
}
```

The existing `CatalogMediaItem`, `AnimeDetail`, `SeasonSummary`, and `EpisodeSummary` remain the public catalog model. Upstream TMDB, AniList, Jikan, TVmaze, Kitsu, and OpenSubtitles types stay inside their adapters.

### Registry separation

The existing playback provider registry remains responsible only for playback source resolution. A new metadata/resource registry describes catalog and enrichment sources. A metadata resource must never be accepted by `playback-resolver.ts` merely because it returns an ID or an availability record.

### Request behavior

All active/fallback adapters use the shared HTTP utility with:

- strict timeout per provider;
- `429` mapping to `rate-limited`, including `Retry-After` when valid;
- network, timeout, invalid JSON/schema, auth, not-found, and upstream 5xx mapping to stable VEYRA error codes;
- bounded cache/revalidation appropriate to catalog volatility;
- schema checks before normalization;
- no silent conversion of provider failure to an empty catalog.

### Stable error mapping and default cache policy

The adapter boundary maps upstream outcomes to stable public VEYRA codes and statuses. Public responses never include raw upstream bodies, secret-bearing request URLs, or internal stack traces.

| Upstream condition | Stable VEYRA error code | Status | Retry policy |
|---|---|---|---|
| Timeout / `AbortError` | `PROVIDER_TIMEOUT` | `unavailable` | Bounded exponential retry for server-side fallback only |
| DNS, connection reset, or other network error | `PROVIDER_NETWORK_ERROR` | `unavailable` | Bounded retry; serve valid cache if present |
| 401 / 403 | `PROVIDER_AUTH_FAILED` | `unavailable` | No immediate retry; configuration diagnosis |
| 404 | `PROVIDER_NOT_FOUND` | `not-found` | No retry |
| 429 | `PROVIDER_RATE_LIMITED` | `rate-limited` | Honor valid `Retry-After`; otherwise provider default backoff |
| 5xx / upstream gateway failure | `PROVIDER_UPSTREAM_ERROR` | `unavailable` | Bounded retry; serve valid cache if present |
| Invalid JSON or schema | `PROVIDER_INVALID_RESPONSE` | `invalid` | No repeated retry until payload changes |
| OpenSubtitles credentials missing | `SUBTITLES_NOT_CONFIGURED` | `unavailable` | No retry until configuration changes |
| OpenSubtitles quota exhausted | `SUBTITLES_QUOTA_EXHAUSTED` | `unavailable` | Honor provider reset/quota window |
| Valid response with zero records | none | `empty` | Cache according to provider TTL |

Default server-side cache policy:

| Source | Fresh TTL | Stale-if-error window |
|---|---:|---:|
| TMDB metadata and watch providers | 15 minutes | 24 hours |
| AniList metadata | 15 minutes | 24 hours |
| Jikan episode enrichment | 1 hour | 7 days |
| TVmaze metadata/episodes | 1 hour | 7 days |
| Kitsu enrichment | 1 hour | 7 days |
| OpenSubtitles search metadata | 10 minutes | 1 hour |

Cache keys contain normalized request parameters and provider ID only. They never contain API keys, auth headers, user library data, or raw search text beyond the server-side cache boundary.

Search remains fast: TMDB and AniList are the primary parallel sources. TVmaze and Kitsu are fallback/enrichment paths, not unconditional fan-out calls for every keystroke. Search responses expose source states so the UI can distinguish no results from partial failure or total unavailability.

### Availability behavior

TMDB Watch Providers may populate `ProviderAvailability` with country, provider name, link, and monetization type. The resolver must not convert that record into an iframe URL. A playable source can only originate from the explicit playback registry and its authorization/origin checks.

An availability object has no `iframeUrl`, `playbackUrl`, or executable source field. Its type and schema make it impossible for a watch CTA or playback resolver to derive a source from it. The UI may offer `View availability` or `View provider`, but never `Watch` unless a separately resolved playback source exists.

### Subtitles behavior

OpenSubtitles is optional and server-only. The initial adapter returns normalized subtitle search metadata and attribution. It does not proxy subtitle files, modify video URLs, or claim that a subtitle is synchronized until VEYRA has actually verified that property. Before activation, the implementation must review the current OpenSubtitles terms and licensing requirements. Attribution is required on every rendered subtitle result. Missing credentials, exhausted quota, or a terms/configuration block maps to `service unavailable`; `no subtitles` is rendered only after a valid successful response contains zero matching records.

## Secrets and outbound egress

- Provider credentials are read only in server modules from the deployment secret manager or server environment. `NEXT_PUBLIC_*` is forbidden for secrets.
- Each adapter has an explicit HTTPS hostname allowlist. Runtime hostnames, URL overrides, redirects to unlisted hosts, and user-provided provider URLs are rejected.
- Requests use fixed endpoint templates and safe query encoding. Errors and observability events redact API keys, authorization headers, raw URLs, search text, and personal library data.
- Browser code receives normalized data and stable error codes only. It never receives provider credentials or internal egress configuration.

## UI behavior

- Resource attribution is visible on detail/availability surfaces.
- Labels remain truthful: `Available to watch`, `Provider controlled`, `Frame loaded; not independently verified`, and `Unavailable` are distinct states.
- Anime pages continue to show episode metadata even when playback is unavailable.
- Search filters and URL state preserve `type`, `anime`, `genre`, `status`, `year`, `language`, and `country` where the provider supports them.
- A source failure shows retry/source status; it must not render an empty rail that looks successful.
- Quality controls appear only for a verified native source or a provider with a documented quality API.

## Testing strategy

Unit tests cover:

- each active adapter's representative upstream payload mapping;
- malformed payload and invalid-ID rejection;
- timeout, network, 401/403, 404, 429, and 5xx mapping;
- `Retry-After` parsing and cache policy;
- provider registry policy, including documentation-only resources being rejected by playback resolution;
- cross-provider deduplication and title ranking;
- availability metadata never becoming a playback URL;
- subtitle metadata status and missing-credential behavior;
- fixture contract tests for every active upstream payload before normalization;
- deduplication/ranking when TMDB, TVmaze, Kitsu, and Jikan identify overlapping content;
- a type and runtime test proving `ProviderAvailability` cannot produce an `iframeUrl`, playback URL, or `Watch` CTA;
- verification records with missing evidence, origin checks, or embedding context being rejected.

Integration/E2E tests cover:

- movie, TV, and anime search with source-state messaging;
- TVmaze/Kitsu fallback behavior;
- anime titles and relation enrichment;
- availability display without a false Watch CTA;
- subtitle service unavailable versus no subtitles found;
- playback verification matrix behavior for every embed/wrapper resource;
- existing movie/TV player behavior and anime unavailable behavior.

Live smoke tests remain separate and opt-in. They may check public provider reachability and frame loading, but they must report `frame loaded` separately from `playback verified`.

## Explicitly out of implementation scope

OMDb, JustWatch private/scraped endpoints, and all community streaming wrappers/scrapers remain documentation-only. They can be reconsidered in a separate design after authorization, operational limits, and a measured product gap are documented.

## External references

- [TMDB API documentation](https://developer.themoviedb.org/docs/getting-started)
- [TMDB movie watch providers](https://developer.themoviedb.org/reference/movie-watch-providers)
- [AniList API v2 documentation](https://anilist.gitbook.io/anilist-apiv2-docs)
- [Jikan API documentation](https://docs.api.jikan.moe/)
- [TVmaze API](https://www.tvmaze.com/api)
- [Kitsu API documentation](https://hummingbird-me.github.io/)
- [OpenSubtitles REST API](https://opensubtitles.stoplight.io/)
- [JustWatch partner API](https://apis.justwatch.com/docs/api/)
