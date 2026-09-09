import { titleOf, type Media } from './tmdb'
import type { SearchIntent } from './search-intent'

const LANGUAGE_CODES: Record<string, string> = {
  Arabic: 'ar', Bengali: 'bn', Chinese: 'zh', English: 'en', French: 'fr', German: 'de',
  Hindi: 'hi', Japanese: 'ja', Kannada: 'kn', Korean: 'ko', Malayalam: 'ml', Marathi: 'mr',
  Punjabi: 'pa', Spanish: 'es', Tamil: 'ta', Telugu: 'te',
}

function normalized(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function yearOf(item: Media): string {
  return (item.release_date || item.first_air_date || '').slice(0, 4)
}

function score(item: Media, intent: SearchIntent): number {
  const title = normalized(titleOf(item))
  const query = normalized(intent.query)
  let value = 0
  if (query && title === query) value += 1000
  else if (query && title.startsWith(query)) value += 500
  else if (query && title.split(' ').some((token) => query.split(' ').includes(token))) value += 200
  if (intent.language && item.original_language === LANGUAGE_CODES[intent.language]) value += 180
  if (intent.year && yearOf(item) === String(intent.year)) value += 140
  if (intent.mediaType && item.media_type === intent.mediaType) value += 100
  value += Math.min(item.popularity ?? 0, 100) * 0.1
  return value
}

export function rankSearchResults(results: Media[], intent: SearchIntent): Media[] {
  return results
    .map((item, index) => ({ item, score: score(item, intent), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item }) => item)
}
