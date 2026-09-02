import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRuntime(minutes?: number): string {
  if (!minutes || minutes <= 0) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function formatYear(dateStr?: string): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 4)
}

export function formatRating(rating?: number): string {
  if (rating === undefined || rating === null) return '—'
  return rating.toFixed(1)
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length).trimEnd() + '…'
}

/** Calculate safe next episode. Returns null if no next episode. */
export function nextEpisode(
  season: number,
  episode: number,
  episodeCount: number,
  seasons: { season_number: number; episode_count: number }[],
): { season: number; episode: number } | null {
  if (episode < episodeCount) {
    return { season, episode: episode + 1 }
  }
  // Try the next season
  const nextSeasons = seasons
    .filter((s) => s.season_number > season && s.season_number > 0 && s.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number)
  if (nextSeasons.length > 0) {
    return { season: nextSeasons[0].season_number, episode: 1 }
  }
  return null
}

/** Calculate safe previous episode. Returns null if no previous episode. */
export function prevEpisode(
  season: number,
  episode: number,
  seasons: { season_number: number; episode_count: number }[],
): { season: number; episode: number } | null {
  if (episode > 1) {
    return { season, episode: episode - 1 }
  }
  // Try the previous season
  const prevSeasons = seasons
    .filter((s) => s.season_number < season && s.season_number > 0 && s.episode_count > 0)
    .sort((a, b) => b.season_number - a.season_number)
  if (prevSeasons.length > 0) {
    const prevS = prevSeasons[0]
    return { season: prevS.season_number, episode: prevS.episode_count }
  }
  return null
}
