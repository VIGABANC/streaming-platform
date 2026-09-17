# World Cinema and Language-Aware Search Plan

World Cinema is a P2 product phase after P0 player correctness is verified.

## Discovery groups

Expose legitimate metadata-driven groupings for Indian, Korean, Japanese,
German, French, and Arabic cinema, with Indian-language filters for Hindi,
Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi, and Punjabi.

## Deterministic intent parsing

Normalize known language aliases, country terms, media types, years, genres,
and `dubbed`/`sub` modifiers before searching. Debounce and cancel requests;
do not call external APIs on every keystroke.

### Current implementation status

Implemented: language aliases, year, movie/TV/anime intent, dubbed/subtitled
modifiers, deterministic relevance scoring, API intent metadata, and the
repeatable evaluation corpus in `docs/audit/search-evaluation-corpus.md`.
The current upstream boundary remains TMDB-only. Country/language discovery
rails and additional legitimate metadata sources are intentionally scheduled
for a later phase rather than inferred from opaque provider availability.

## Ranking and evaluation

Rank exact normalized title and original-title matches above prefix/token,
language, year, media type, genre, availability, popularity, and rating
signals. Keep `tmdb` and `anilist` IDs source-qualified. Add a repeatable corpus
covering exact titles, typos, Malayalam thriller, Hindi comedy, Korean drama,
dubbed anime, and ambiguous movie/TV titles.

## Missing availability

Allow a report containing only a known source ID, coarse region, media type,
provider context, and optional description. The flow must not promise uploads or
copyrighted content.
