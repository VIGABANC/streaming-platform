# VEYRA anime data sources

## Precedence and boundaries

- TMDB remains the canonical source for movies, TV, provider availability, and all TMDB IDs.
- AniList is the primary anime metadata/discovery source. Anime records retain `source: anilist`, `kind: anime`, and the AniList `sourceId`.
- Jikan is optional, detail-only MAL enrichment. It is never called for home rails or one request per card.
- Watchmode is optional provider-link enrichment. TMDB provider availability remains the primary region-aware result and Watchmode cannot replace or block it.
- YouTube is official embed/link-only. VEYRA does not scrape, proxy, download, or extract video streams.

## Caching and failure behavior

List AniList queries use 15-minute server fetch caching; airing uses 5 minutes; detail uses 6 hours. Jikan uses 24-hour caching and Watchmode uses 6-hour caching. Optional failures return typed empty/unavailable results and do not block the anime page.

## Legal/product gate

AniList’s terms distinguish free non-commercial use from commercial use and restrict competing list/tracker services. VEYRA’s watchlist/library behavior therefore requires product/legal confirmation of permitted use and any required license before enabling this feature in a commercial production deployment. The code keeps the boundary explicit; it does not claim that this review has occurred.

## Required configuration

`TMDB_API_KEY` remains the only required catalog credential. `ANIME_MAL_ENRICHMENT=false` by default. `WATCHMODE_API_KEY` is optional and must never be exposed through a `NEXT_PUBLIC_*` variable.
