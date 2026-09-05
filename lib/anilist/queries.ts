export const ANIME_LIST_QUERY = `
  query AnimeList($page: Int, $perPage: Int, $sort: [MediaSort], $status: MediaStatus, $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $search: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage total }
      media(type: ANIME, sort: $sort, status: $status, season: $season, seasonYear: $seasonYear, format: $format, search: $search) {
        id title { romaji english native } season seasonYear format status episodes averageScore popularity description(asHtml: false) coverImage { large } bannerImage
      }
    }
  }
`

export const ANIME_DETAIL_QUERY = `
  query AnimeDetail($id: Int!) {
    Media(id: $id, type: ANIME) {
      id title { romaji english native } season seasonYear format status episodes averageScore popularity description(asHtml: false) coverImage { large } bannerImage
      genres duration tags { id name rank } studios { nodes { id name } edges { isMain } }
      nextAiringEpisode { episode airingAt }
      characters(sort: [ROLE, RELEVANCE], perPage: 10) { edges { node { id name { full } image { large } } role voiceActors(language: JAPANESE, sort: [RELEVANCE], perPage: 1) { name { full } } } }
      staff(sort: [RELEVANCE], perPage: 10) { edges { node { id name { full } image { large } } roles } }
      relations { edges { relationType node { id type title { romaji english native } season seasonYear format status episodes averageScore popularity description(asHtml: false) coverImage { large } bannerImage } } }
      recommendations(sort: [RATING_DESC], perPage: 10) { nodes { mediaRecommendation { id type title { romaji english native } season seasonYear format status episodes averageScore popularity description(asHtml: false) coverImage { large } bannerImage } } }
      trailer { site id thumbnail }
      externalLinks { site id }
    }
  }
`
