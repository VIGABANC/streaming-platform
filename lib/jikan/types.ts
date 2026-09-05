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
