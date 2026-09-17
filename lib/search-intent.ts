export type SearchMediaType = 'movie' | 'tv'

export interface SearchIntent {
  query: string
  language?: string
  year?: number
  mediaType?: SearchMediaType
  audioPreference?: 'dubbed'
  subtitlePreference?: 'subbed'
}

const LANGUAGE_ALIASES: Record<string, string> = {
  arabic: 'Arabic', ar: 'Arabic', bengali: 'Bengali', bangla: 'Bengali',
  chinese: 'Chinese', mandarin: 'Chinese', zh: 'Chinese', english: 'English', en: 'English',
  french: 'French', fr: 'French', german: 'German', de: 'German',
  hindi: 'Hindi', hi: 'Hindi', japanese: 'Japanese', japan: 'Japanese', ja: 'Japanese',
  kannada: 'Kannada', korean: 'Korean', korea: 'Korean', ko: 'Korean',
  malayalam: 'Malayalam', malayali: 'Malayalam', marathi: 'Marathi',
  punjabi: 'Punjabi', spanish: 'Spanish', tamil: 'Tamil', telugu: 'Telugu',
}

export function parseSearchIntent(input: string): SearchIntent {
  const tokens = input.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const query: string[] = []
  const intent: SearchIntent = { query: '' }

  for (const token of tokens) {
    const year = /^((?:19|20)\d{2})$/.exec(token)?.[1]
    if (year) {
      intent.year = Number(year)
      continue
    }
    if (LANGUAGE_ALIASES[token]) {
      intent.language = LANGUAGE_ALIASES[token]
      continue
    }
    if (token === 'movie' || token === 'film' || token === 'films') {
      intent.mediaType = 'movie'
      continue
    }
    if (token === 'anime') {
      intent.mediaType = 'tv'
      query.push(token)
      continue
    }
    if (token === 'dub' || token === 'dubbed') {
      intent.audioPreference = 'dubbed'
      continue
    }
    if (token === 'sub' || token === 'subbed' || token === 'subtitles') {
      intent.subtitlePreference = 'subbed'
      continue
    }
    query.push(token)
  }

  intent.query = query.join(' ')
  return intent
}
