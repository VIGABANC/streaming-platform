# VEYRA provider verification — 2026-09-13

## Objective

Adopt only playback providers for which VEYRA can document both:

1. authorization to link/embed/play the relevant content; and
2. a stable technical contract for the advertised playback mode.

An endpoint existing, returning a URL, or being listed in a community project
is not sufficient evidence.

## Findings

| Candidate | What the official material supports | Playback decision |
|---|---|---|
| TMDB | Movie/TV metadata and watch-provider availability by country | Metadata/discovery only; not a VEYRA playback source |
| AniList | Anime metadata through GraphQL | Metadata/discovery only; no authorized VEYRA playback source |
| Jikan | Anime/MAL metadata and episode enrichment | Metadata/discovery only; no authorized VEYRA playback source |
| Current iframe origins | Opaque cross-origin documents already configured in the repo | Remain `unverified`, `frame-load-only`, and quality `provider-controlled` |
| User-listed scraping/embed APIs | No authorization, ownership, or documented VEYRA playback contract verified | Do not integrate or recommend |

## Decision

No new playback provider is activated in this objective. The existing registry
keeps its providers available only as explicitly labelled unverified external
embed candidates. VEYRA does not claim that an iframe is legal, that media is
playing, or that a quality/audio/subtitle capability exists.

Anime playback remains unavailable until an authorized provider supplies all of
the following:

- written authorization or a clearly applicable official embed/licensing
  policy;
- stable origin and documented movie/series/anime and episode identifiers;
- documented readiness/error events if VEYRA is expected to verify playback;
- documented quality, subtitle, and audio-track capabilities before those
  controls can appear;
- region, rate-limit, privacy, and uptime terms suitable for production;
- a live smoke test that passes at the frame/source level without being
  misreported as playback verification.

## Official references

- [TMDB API getting started and terms](https://developer.themoviedb.org/docs/getting-started)
- [AniList API documentation](https://anilist.gitbook.io/anilist-apiv2-docs)
- [Jikan REST API documentation](https://docs.api.jikan.moe/)

## Next approved path

The next implementation step is an authorized native adapter for VEYRA-owned
or explicitly licensed MP4/HLS/DASH assets. Until that source exists, the
`NativeMediaEngine` contract stays gated and the player continues to expose
only the truthful external-embed ownership model.
