export interface JikanEnrichment {
  score: number | null
  rank: number | null
  popularity: number | null
}

export interface JikanAnimeResponse {
  data?: {
    score?: unknown
    rank?: unknown
    popularity?: unknown
  }
}

export interface JikanTopAnimeResponse {
  data?: Array<{ mal_id?: unknown; title?: unknown; images?: { jpg?: { image_url?: unknown } }; synopsis?: unknown; score?: unknown }>
}
