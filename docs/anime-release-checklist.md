# VEYRA anime release checklist

This checklist separates code-verified behavior from checks that require the
target deployment, credentials, or a product/legal decision.

## Code-verified

- [x] AniList is the anime metadata source; TMDB remains the movie/TV source.
- [x] AniList requests are server-side, bounded, cached, and failure-isolated.
- [x] Jikan is optional detail enrichment and never a rail dependency.
- [x] Watchmode is optional provider-link enrichment and never blocks TMDB.
- [x] Anime IDs remain source-aware in search, library, history, and routing.
- [x] Invalid anime IDs are rejected; transient detail failures are unavailable
      and non-indexable.
- [x] Trailer embeds are YouTube-only and do not claim unverified provenance.
- [x] No scraper, stream extractor, paid video SDK, or client-visible optional
      credential was added.
- [x] `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run build`,
      `npm audit --omit=dev`, and Playwright browser checks pass locally.

## Required before production promotion

- [ ] Set and verify `NEXT_PUBLIC_SITE_URL`, Supabase URL/anon key, and
      `TMDB_API_KEY` in the deployment environment. Keep `WATCHMODE_API_KEY`
      server-only; enable `ANIME_MAL_ENRICHMENT=true` only after approving its
      use.
- [ ] Apply and verify
      `supabase/migrations/202609050001_create_user_library_snapshots.sql`.
- [ ] Test two authenticated users, account switching, logout cleanup,
      multi-device sync, invalid backup import, and RLS denial with real
      Supabase credentials.
- [ ] Smoke-test `/`, `/anime`, `/anime/1`,
      `/search?scope=anime&q=one%20piece`, `/robots.txt`, and `/sitemap.xml` in
      the deployed environment; record status, console errors, failed network
      requests, and 390x844 overflow.
- [ ] Run real-device Lighthouse/PageSpeed and PWA install/offline/update
      checks. Do not substitute local synthetic scores for these results.
- [ ] Confirm AniList attribution/terms and the commercial posture for AniList,
      Jikan, Watchmode, and TMDB.
- [ ] Review licensing/terms for the pre-existing `vidsrc`, `2embed`, and
      `autoembed` playback registry before promoting production playback.
- [ ] Decide whether any bounded, known anime detail URLs belong in the public
      sitemap; never enumerate unbounded AniList results.
