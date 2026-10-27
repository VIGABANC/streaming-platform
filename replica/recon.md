# VEYRA Replica Recon

## Product

VEYRA is a dark, cinematic streaming-discovery web app. It presents TMDB-backed movies and television metadata, anime metadata with an explicit unavailable state, provider/catalog views, watch pages, and browser-local library surfaces.

## Scope

- Platform: responsive web, desktop and mobile browser layouts.
- Primary journeys: discover, browse, search, inspect a title, start playback, select a TV episode, save library items, and recover from unavailable catalog/provider data.
- Reviewed surfaces: landing, catalog rails/grids, detail pages, player shells, anime fallback, provider catalogs, library/account pages, auth pages, offline/audit pages.
- Not claimed as verified: third-party hosted playback internals, licensed media delivery, real authentication, or live Jikan/TMDB availability.

## Screen map

| ID | Screen / route family | Main job |
| --- | --- | --- |
| S01 | Landing `/`, `/landing` | Orient, discover, choose a provider |
| S02 | Browse `/browse` | Browse mixed catalog metadata |
| S03 | Movies `/movies` | Filter and browse movies |
| S04 | TV `/tv` | Filter and browse series |
| S05 | Anime `/anime` | Browse anime and explain fallback state |
| S06 | Detail `/movie/[id]`, `/tv/[id]`, `/anime/[id]` | Inspect metadata and actions |
| S07 | Player `/watch/movie/[id]` | Play or explain provider state |
| S08 | TV player `/watch/tv/[id]/[season]/[episode]` | Watch an episode and navigate adjacent episodes |
| S09 | Anime player `/watch/anime/[id]/[episode]` | Refuse unverified playback truthfully |
| S10 | Discovery `/discover`, `/new`, `/top10`, `/world-cinema` | Explore curated catalog views |
| S11 | Search `/search` | Find titles and handle empty/error results |
| S12 | Provider `/providers`, `/provider/[slug]`, `/streaming/[id]` | Explore catalogs by service |
| S13 | Library `/my-list`, `/favorites`, `/history` | Read and manage browser-local library state |
| S14 | Account `/profile`, `/settings`, `/auth/*` | Manage preferences and auth entry points |
| S15 | System `/offline`, `/audit`, not-found | Recover, audit, and explain system state |

## Component and data model

- Shell: header, skip link, main landmark, footer, mobile navigation, toast/library synchronization.
- Discovery: hero, provider switcher, media rails, poster/card grids, ranking cards, search showcase.
- Details: hero, metadata, watchlist/favorites/share actions, collection and recommendation rails.
- Playback: provider selection, player preference state, cinema/theater/fullscreen controls, verified/unavailable states.
- Data: `Media`, movie/TV detail, anime detail, watch provider, player source, season/episode, and local library records.

## Dependencies and risks

TMDB/Jikan/network responses can be unavailable or slow. The app must preserve a usable shell and communicate unavailable metadata/playback without inventing a source or embedding an unverified anime player.

## 2026-10-27 audit addendum

Current route inventory also includes `/api/health/providers`, `/api/player/preference`, `/api/search`, `/api/tv/[id]/season/[season]`, `/api/missing-availability`, `/api/telegram/webhook`, `/robots.txt`, and `/sitemap.xml`. Invalid-route coverage includes malformed IDs, zero season/episode values, and an unknown path. The current build has no verified third-party playback or real authenticated deployment evidence.

The headed browser also exposed one VEYRA-controlled defect: persisted provider-health ordering was read from `localStorage` during `PlayerFrame` render, causing a server/client provider-list mismatch and React hydration warning. The owning-boundary fix is in `components/player/PlayerFrame.tsx`, `lib/playback-resolver.ts`, and `lib/player.ts`; the provider-health snapshot is now loaded after hydration. The fix is covered by unit and Playwright regression tests and verified by clean production E2E.

The current headed browser also confirms the external-provider boundary: `/watch/movie/550` can render an opaque 2Embed document, but server controls are labeled `UNVERIFIED` and the shell explicitly says that a frame load does not verify playback. This is not counted as an authorized or independently verified integration.
