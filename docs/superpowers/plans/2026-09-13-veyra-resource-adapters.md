# VEYRA Resource and API Adapters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add all requested catalog, availability, anime, subtitle, and community-resource integrations behind typed server-side boundaries without enabling unverified playback sources.

**Architecture:** Introduce a metadata/resource registry separate from the existing playback registry. Active adapters normalize upstream payloads into VEYRA catalog types; fallback adapters run only when policy allows; documentation-only streaming resources are recorded but rejected before playback resolution. Availability records contain no executable source fields, and every adapter returns explicit source status and stable error codes.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Vitest, Playwright, server-side `fetch`, Next revalidation/cache, existing TMDB/AniList/Jikan modules, existing playback resolver.

**Spec:** `docs/superpowers/specs/2026-09-13-veyra-resource-adapters-design.md`

## Global Constraints

- `PlaybackProviderVerification.enabled` defaults to `false` and requires authorization evidence, origin checks, an allowed embedding context, and a current verification record.
- Metadata and availability never create or imply an iframe URL, native media URL, or playback CTA.
- TMDB, AniList, Jikan, TVmaze, Kitsu, and OpenSubtitles adapters are server-only; provider credentials never enter browser code, logs, URLs, or client errors.
- OMDb, JustWatch private/scraped endpoints, and all streaming wrappers/scrapers remain documentation-only in this plan.
- Every upstream response is schema-checked before normalization; failures are never converted silently into empty results.
- Public source states are `success`, `empty`, `partial`, `not-found`, `rate-limited`, `unavailable`, or `invalid`.
- Default fresh/stale cache windows are TMDB/AniList 15m/24h, Jikan/TVmaze/Kitsu 1h/7d, and OpenSubtitles 10m/1h.
- No Anime playback source is activated without separate authorization and verification.

---

### M1: Contracts, registry, error/cache taxonomy, and policy tests

**Files:**
- Create: `lib/catalog-providers/types.ts`
- Create: `lib/catalog-providers/errors.ts`
- Create: `lib/catalog-providers/cache-policy.ts`
- Create: `lib/catalog-providers/registry.ts`
- Create: `lib/catalog-providers/index.ts`
- Create: `lib/playback-verification.ts`
- Modify: `lib/media-model.ts`
- Modify: `lib/provider-http.ts`
- Test: `tests/unit/catalog-providers/contracts.test.ts`
- Test: `tests/unit/catalog-providers/registry.test.ts`
- Test: `tests/unit/catalog-providers/errors.test.ts`
- Test: `tests/unit/catalog-providers/cache-policy.test.ts`
- Test: `tests/unit/playback-verification.test.ts`

**Interfaces:**
- `CatalogProviderResult<T>` and `CatalogProviderStatus` are consumed by every later adapter and by `catalog-search.ts`.
- `CatalogProviderError` exposes `code`, `status`, and optional `retryAfterSeconds` without raw upstream data; subtitle configuration/quota use `SUBTITLES_NOT_CONFIGURED` and `SUBTITLES_QUOTA_EXHAUSTED`.
- `CatalogProviderDefinition` exposes resource category, runtime policy, supported media, allowlisted hosts, attribution, and optional adapter capabilities.
- `PlaybackProviderVerification` and `isPlaybackProviderEligible()` are consumed by `lib/player.ts` and `lib/playback-resolver.ts`.
- `ProviderAvailability` is a metadata-only type with offers and provider links, but no `iframeUrl`, `playbackUrl`, or executable source property.

- [ ] **Step 1: Write failing contract tests for statuses and metadata-only availability**

```ts
it('does not allow availability records to carry executable playback fields', () => {
  const availability: ProviderAvailability = {
    providerId: 'tmdb:netflix',
    providerName: 'Netflix',
    region: 'US',
    offers: [{ kind: 'flatrate', url: 'https://www.netflix.com/title/1' }],
    attribution: 'TMDB',
  }
  expect('iframeUrl' in availability).toBe(false)
  expect('playbackUrl' in availability).toBe(false)
})
```

- [ ] **Step 2: Run the new contract tests and verify the missing interfaces fail**

Run: `npm test -- --run tests/unit/catalog-providers/contracts.test.ts tests/unit/catalog-providers/errors.test.ts`

Expected: FAIL because the new provider contracts and metadata-only availability type do not exist yet.

- [ ] **Step 3: Add the normalized contracts and stable error mapping**

Implement `CatalogProviderStatus`, `CatalogProviderResult<T>`, `CatalogProviderErrorCode`, and `CatalogProviderError` with this mapping:

```ts
const ERROR_STATUS: Record<CatalogProviderErrorCode, CatalogProviderStatus> = {
  PROVIDER_TIMEOUT: 'unavailable',
  PROVIDER_NETWORK_ERROR: 'unavailable',
  PROVIDER_AUTH_FAILED: 'unavailable',
  PROVIDER_NOT_FOUND: 'not-found',
  PROVIDER_RATE_LIMITED: 'rate-limited',
  PROVIDER_UPSTREAM_ERROR: 'unavailable',
  PROVIDER_INVALID_RESPONSE: 'invalid',
  SUBTITLES_NOT_CONFIGURED: 'unavailable',
  SUBTITLES_QUOTA_EXHAUSTED: 'unavailable',
}
```

`parseRetryAfter(response)` accepts integer seconds and valid HTTP-date headers, rejects negative values, and never exposes response bodies.

- [ ] **Step 4: Add cache policies and provider/resource registry records**

Create `CACHE_POLICIES` with exact fresh/stale seconds from the spec. Register every resource from the approved inventory: TMDB, TMDB Watch Providers, AniList, Jikan, TVmaze, Kitsu, OpenSubtitles, OMDb, JustWatch, VidSrc.sbs, `vidsrc.ts`, `vidsrc-api-v2`, `svidsrc-api`, Consumet, `anime-sdk`, Dramacool, Megaplay, hianime-api, AniProject, existing VidSrc/2Embed/AutoEmbed records, subtitle tools, and Microlink/Kurozora. Set only approved metadata resources to `active`/`fallback`/`optional`; set community streaming resources to `documentation-only`.

- [ ] **Step 5: Add verification eligibility and egress-safe HTTP helpers**

Add `isPlaybackProviderEligible(provider, verification, now)` so missing evidence, missing origin checks, an unsupported context, disabled state, or stale `lastVerifiedAt` returns `false`. Extend `fetchWithTimeout` helpers to classify timeout/network/HTTP failures and constrain requests to an adapter-owned HTTPS hostname allowlist.

- [ ] **Step 6: Run unit tests and commit the contracts**

Run: `npm test -- --run tests/unit/catalog-providers tests/unit/playback-verification.test.ts`

Expected: PASS, including tests that documentation-only resources cannot enter playback and that availability cannot produce a Watch CTA or executable URL.

Commit: `git add lib/catalog-providers lib/playback-verification.ts lib/media-model.ts lib/provider-http.ts tests/unit/catalog-providers tests/unit/playback-verification.test.ts && git commit -m "feat: add catalog provider contracts and policy registry"`

### M2: Normalize TMDB, AniList, Jikan, TVmaze, and Kitsu

**Files:**
- Create: `lib/catalog-providers/tmdb.ts`
- Create: `lib/catalog-providers/anilist.ts`
- Create: `lib/catalog-providers/jikan.ts`
- Create: `lib/catalog-providers/tvmaze.ts`
- Create: `lib/catalog-providers/kitsu.ts`
- Modify: `lib/tmdb.ts`
- Modify: `lib/anilist.ts`
- Modify: `lib/jikan.ts`
- Modify: `lib/catalog-model.ts`
- Modify: `lib/catalog-search.ts`
- Modify: `app/api/search/route.ts`
- Create: `tests/fixtures/catalog/tmdb-search.json`
- Create: `tests/fixtures/catalog/anilist-search.json`
- Create: `tests/fixtures/catalog/jikan-episodes.json`
- Create: `tests/fixtures/catalog/tvmaze-show.json`
- Create: `tests/fixtures/catalog/tvmaze-episodes.json`
- Create: `tests/fixtures/catalog/kitsu-anime.json`
- Test: `tests/unit/catalog-providers/tmdb.test.ts`
- Test: `tests/unit/catalog-providers/anilist.test.ts`
- Test: `tests/unit/catalog-providers/jikan.test.ts`
- Test: `tests/unit/catalog-providers/tvmaze.test.ts`
- Test: `tests/unit/catalog-providers/kitsu.test.ts`
- Test: `tests/integration/search.test.ts`

**Interfaces:**
- Each adapter exports a provider-specific input type and functions returning `CatalogProviderResult<CatalogMediaItem[]>`, `CatalogProviderResult<AnimeDetail>`, or normalized episode/season data.
- Upstream JSON interfaces are private to each adapter file.
- Existing `lib/tmdb.ts`, `lib/anilist.ts`, and `lib/jikan.ts` remain compatibility facades while pages migrate to `lib/catalog-providers/index.ts`.
- `searchCatalog(options: CatalogSearchOptions)` consumes the adapters and returns source states plus ranked, deduplicated normalized items.

- [ ] **Step 1: Add fixture contract tests before changing adapters**

For each fixture, assert the normalized result has a canonical ID, preferred title, attribution, valid media kind, and no upstream-only property leaking into the domain result. Add malformed JSON/schema fixtures and assert `PROVIDER_INVALID_RESPONSE`.

- [ ] **Step 2: Implement the TMDB adapter as the authoritative movie/TV adapter**

Move the server request and normalization boundary into `lib/catalog-providers/tmdb.ts`. Preserve existing detail/search behavior and map TMDB movie/TV/season/episode payloads to `Movie`, `Series`, `Season`, and `Episode`. Keep TMDB image URL helpers in the compatibility facade only if existing UI imports require them.

- [ ] **Step 3: Implement AniList and Jikan adapters without changing anime playback policy**

Move AniList title, relation, recommendation, genre, studio, status, format, and date mapping into `lib/catalog-providers/anilist.ts`. Move Jikan episode mapping into `lib/catalog-providers/jikan.ts`. Preserve original, English, native, and synonym titles. A successful anime metadata response must not create a `PlaybackSource`.

- [ ] **Step 4: Implement TVmaze and Kitsu fallback adapters**

Normalize TVmaze show/episode payloads into `Series`, `Season`, and `Episode`. Normalize Kitsu titles, poster/banner, status, subtype, genres, and relationships into anime domain data. Use fixed HTTPS hosts, provider-specific timeout/cache policy, schema validation, and `CatalogProviderError` mapping for 401/403, 404, 429, 5xx, timeout, network, and malformed responses.

- [ ] **Step 5: Integrate fallback policy and source-state messaging**

Update `catalog-search.ts` so TMDB and AniList remain the primary parallel search sources. Invoke TVmaze/Kitsu only for configured fallback/enrichment paths, never on every debounced keystroke by default. Preserve distinct `success`, `empty`, `partial`, `rate-limited`, `unavailable`, and `not-found` source states in `app/api/search/route.ts`; do not return `results: []` for total upstream failure.

- [ ] **Step 6: Test collisions, ranking, and compatibility**

Add assertions for the same title from TMDB/TVmaze/Kitsu/Jikan, ensuring canonical IDs remain distinct until a deliberate external-ID match exists, then dedupe only the matched identity. Exact title matches rank ahead of prefix/includes while movie, TV, anime, and franchise kinds remain separate.

Run: `npm test -- --run tests/unit/catalog-providers tests/unit/catalog-search.test.ts tests/integration/search.test.ts`

Expected: PASS with all fixture contract and source-state tests.

Commit: `git add lib/catalog-providers lib/tmdb.ts lib/anilist.ts lib/jikan.ts lib/catalog-model.ts lib/catalog-search.ts app/api/search/route.ts tests/fixtures/catalog tests/unit/catalog-providers tests/unit/catalog-search.test.ts tests/integration/search.test.ts && git commit -m "feat: normalize catalog providers behind adapters"`

### M3: TMDB availability metadata with playback derivation barrier

**Files:**
- Create: `lib/catalog-providers/availability.ts`
- Create: `app/api/availability/[type]/[id]/route.ts`
- Create: `components/media/AvailabilityPanel.tsx`
- Modify: `lib/media-model.ts`
- Modify: `app/movie/[id]/page.tsx`
- Modify: `app/tv/[id]/page.tsx`
- Modify: `app/anime/[id]/page.tsx`
- Modify: `components/media/MediaDetailActions.tsx`
- Test: `tests/unit/catalog-providers/availability.test.ts`
- Test: `tests/integration/availability.test.ts`
- Test: `tests/e2e/availability.spec.ts`

**Interfaces:**
- `getAvailability(type, id, region): Promise<CatalogProviderResult<ProviderAvailability[]>>` is the only public availability service.
- `ProviderAvailability` contains provider identity, region, offer kind, legal provider URL, and attribution; it contains no playback URL.
- The detail UI consumes availability state and renders `View availability`/`View provider`, never a Watch action derived from this data.

- [ ] **Step 1: Write failing tests for availability normalization and derivation prevention**

Test flatrate, rent, buy, free, and ads mappings; absent-region behavior; malformed provider payloads; invalid type/ID; and the invariant that no returned object has `iframeUrl`, `playbackUrl`, or a source builder.

- [ ] **Step 2: Implement the TMDB Watch Providers adapter**

Use the fixed TMDB endpoint and normalized region validation. Map provider offers and the provider landing-page link to metadata records with `attribution: 'TMDB'`. A missing region is `empty` only after a valid TMDB response contains no offers; upstream failure remains `unavailable`, `rate-limited`, or another explicit status.

- [ ] **Step 3: Add the server route with safe public payloads**

Validate `type` as `movie | tv` and IDs as positive bounded integers. Return normalized records and status/error code only. Apply `Cache-Control` consistent with the 15-minute fresh/24-hour stale policy and never serialize secret-bearing upstream URLs.

- [ ] **Step 4: Add the detail-page availability panel**

Show region, offer type, provider name, attribution, and provider link. Use `View availability` or `View provider` copy. If availability fails, render retry/unavailable messaging; never render the panel as an empty successful rail.

- [ ] **Step 5: Run tests and verify the resolver boundary**

Run: `npm test -- --run tests/unit/catalog-providers/availability.test.ts tests/integration/availability.test.ts`

Expected: PASS, including a test that `playback-resolver.ts` accepts no object returned by `getAvailability()` as a `PlaybackSource`.

Commit: `git add lib/catalog-providers/availability.ts app/api/availability components/media/AvailabilityPanel.tsx lib/media-model.ts app/movie/[id]/page.tsx app/tv/[id]/page.tsx app/anime/[id]/page.tsx components/media/MediaDetailActions.tsx tests/unit/catalog-providers/availability.test.ts tests/integration/availability.test.ts tests/e2e/availability.spec.ts && git commit -m "feat: add truthful availability metadata"`

### M4: Optional OpenSubtitles metadata adapter

**Files:**
- Create: `lib/catalog-providers/opensubtitles.ts`
- Create: `app/api/subtitles/route.ts`
- Create: `components/media/SubtitleAvailability.tsx`
- Modify: `.env.example`
- Modify: `README.md`
- Test: `tests/unit/catalog-providers/opensubtitles.test.ts`
- Test: `tests/integration/subtitles.test.ts`
- Test: `tests/e2e/subtitles.spec.ts`

**Interfaces:**
- `searchSubtitles(input): Promise<CatalogProviderResult<SubtitleMatch[]>>` is server-only and returns metadata/attribution, not proxied subtitle files.
- `SubtitleMatch` includes language, format, release metadata, provider attribution, and a non-executable provider reference.
- Missing `OPENSUBTITLES_API_KEY`, invalid terms/configuration, quota exhaustion, timeout, or upstream failure returns `unavailable`; only a valid successful zero-match response returns `empty`.

- [ ] **Step 1: Review and encode activation requirements**

Document the current OpenSubtitles terms/licensing review requirement in `README.md`. Read credentials only from server environment, require a configured user-agent if the API contract requires it, and keep the feature disabled when credentials are absent.

- [ ] **Step 2: Write fixture tests for valid, empty, malformed, unauthorized, rate-limited, and quota responses**

Assert that valid results include attribution and that neither files nor executable URLs are returned. Assert missing credentials maps to `SUBTITLES_NOT_CONFIGURED`/`unavailable`, not `empty`.

- [ ] **Step 3: Implement the adapter and route**

Use a fixed HTTPS OpenSubtitles host, safe query encoding, timeout, cache policy, response-schema validation, `Retry-After`, and stable provider error mapping. Return normalized metadata through the route and redact all upstream details from client errors.

- [ ] **Step 4: Implement UI states**

Render `Subtitles available`, `No subtitles found` only for a valid empty response, and `Subtitle service unavailable` for missing credentials/quota/failure. Display required attribution for every match.

- [ ] **Step 5: Run tests and commit**

Run: `npm test -- --run tests/unit/catalog-providers/opensubtitles.test.ts tests/integration/subtitles.test.ts`

Expected: PASS with no secret required for the test suite.

Commit: `git add lib/catalog-providers/opensubtitles.ts app/api/subtitles components/media/SubtitleAvailability.tsx .env.example README.md tests/unit/catalog-providers/opensubtitles.test.ts tests/integration/subtitles.test.ts tests/e2e/subtitles.spec.ts && git commit -m "feat: add optional subtitle availability adapter"`

### M5: Verification matrix, playback guard, E2E/live smoke, and final verification

**Files:**
- Modify: `lib/playback-verification.ts`
- Modify: `lib/player.ts`
- Modify: `lib/playback-resolver.ts`
- Modify: `docs/audit/provider-verification-2026-09-13.md`
- Modify: `docs/audit/player-provider-matrix.md`
- Modify: `docs/audit/player-reliability-report.md`
- Modify: `tests/unit/playback-resolver.test.ts`
- Modify: `tests/unit/catalog-providers/registry.test.ts`
- Modify: `tests/e2e/player.spec.ts`
- Modify: `tests/e2e/movie.spec.ts`
- Modify: `tests/e2e/tv.spec.ts`
- Modify: `tests/e2e/anime.spec.ts`
- Modify: `tests/live/player-live.spec.ts`
- Modify: `.github/workflows/verify.yml`
- Modify: `.github/workflows/live-smoke.yml`

**Interfaces:**
- `PlaybackProviderVerification` is the only authorization gate for a playback provider.
- `resolvePlaybackSources()` receives catalog identity and returns only eligible `PlaybackSource` candidates.
- External embeds report `frame-loaded` separately from `playback-verified`; opaque providers never receive the latter.
- The verification matrix lists every current embed/wrapper as `rejected` or `documentation-only` unless evidence fields are complete.

- [ ] **Step 1: Add verification records for every current and requested embed/wrapper**

Create explicit records for VidSrc.sbs, VidSrc.xyz, VidSrc Wiki, 2Embed, AutoEmbed, Consumet, Dramacool, Megaplay, `anime-sdk`, hianime-api, AniProject, and all listed wrappers. Set `enabled: false`, include empty/insufficient authorization evidence, and record risk notes explaining why playback is unavailable.

- [ ] **Step 2: Guard the playback registry and resolver**

Require `isPlaybackProviderEligible()` before source builders execute. Reject metadata resources, availability records, user URL overrides, non-HTTPS URLs, unallowlisted origins, Anime sources without verification, and stale verification records. Preserve manual provider preference only if the provider is currently eligible.

- [ ] **Step 3: Add E2E coverage for truthful source states**

Mock normalized route responses to cover movie search, TV search, anime search/detail, availability success/failure, provider switching, automatic failover, timeout/retry, offline/reconnect, theater/lights-off/container fullscreen, and episode navigation. Assert `Frame loaded; not independently verified` rather than `Playback verified` for opaque embeds, and assert Anime `Unavailable` when no verified source exists.

- [ ] **Step 4: Keep live smoke isolated and privacy-safe**

Run live smoke only through `playwright.live.config.ts` and `tests/live/player-live.spec.ts`. Check reachability and frame load where permitted, never assert undocumented provider controls/quality, and never log URLs, tokens, search text, or library contents. Keep Chromium installation in CI before E2E.

- [ ] **Step 5: Run the complete verification suite**

Run:

```bash
npm run typecheck
npm run lint
npm test -- --run
npm run test:e2e
npm run build
npm audit --omit=dev --audit-level=high
```

Run the separate live suite only when the CI environment has the required browser and network access:

```bash
npm run test:live
```

Expected: unit, lint, typecheck, build, and security checks pass locally; E2E/live results are reported separately if browser installation or external providers remain unavailable.

- [ ] **Step 6: Update audit handoff and inspect the final diff**

Run `git diff --check`, `git status --short`, and `git log --oneline -5`. Confirm the final report lists changed files, tests actually run, external API limitations, and the fact that no unverified provider was activated.

Commit: `git add lib/player.ts lib/playback-resolver.ts docs/audit tests/unit tests/e2e tests/live .github/workflows && git commit -m "test: enforce verified playback provider boundary"`
