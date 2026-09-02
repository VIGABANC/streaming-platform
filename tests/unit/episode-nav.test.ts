import { describe, it, expect } from 'vitest'

function calculateEpisodeNavigation(
  showId: string | number,
  currentSeason: number,
  currentEpisode: number,
  seasons: { season_number: number; episode_count: number }[],
) {
  let prevHref: string | null = null
  let nextHref: string | null = null

  const seasonObj = seasons.find((s) => s.season_number === currentSeason)
  const episodeCount = seasonObj?.episode_count || 0

  if (currentEpisode > 1) {
    prevHref = `/watch/tv/${showId}/${currentSeason}/${currentEpisode - 1}`
  }

  if (episodeCount > 0 && currentEpisode < episodeCount) {
    nextHref = `/watch/tv/${showId}/${currentSeason}/${currentEpisode + 1}`
  } else {
    // Check if next season exists with episodes
    const nextSeason = seasons.find((s) => s.season_number === currentSeason + 1)
    if (nextSeason && nextSeason.episode_count > 0) {
      nextHref = `/watch/tv/${showId}/${nextSeason.season_number}/1`
    }
  }

  return { prevHref, nextHref }
}

describe('TV Episode Navigation Logic', () => {
  const showSeasons = [
    { season_number: 1, episode_count: 10 },
    { season_number: 2, episode_count: 8 },
  ]

  it('handles first episode of Season 1 (prev is null, next is episode 2)', () => {
    const nav = calculateEpisodeNavigation('123', 1, 1, showSeasons)
    expect(nav.prevHref).toBeNull()
    expect(nav.nextHref).toBe('/watch/tv/123/1/2')
  })

  it('handles middle episode (both prev and next exist)', () => {
    const nav = calculateEpisodeNavigation('123', 1, 5, showSeasons)
    expect(nav.prevHref).toBe('/watch/tv/123/1/4')
    expect(nav.nextHref).toBe('/watch/tv/123/1/6')
  })

  it('crosses to Season 2 on final episode of Season 1', () => {
    const nav = calculateEpisodeNavigation('123', 1, 10, showSeasons)
    expect(nav.prevHref).toBe('/watch/tv/123/1/9')
    expect(nav.nextHref).toBe('/watch/tv/123/2/1')
  })

  it('identifies series finale (no next season)', () => {
    const nav = calculateEpisodeNavigation('123', 2, 8, showSeasons)
    expect(nav.prevHref).toBe('/watch/tv/123/2/7')
    expect(nav.nextHref).toBeNull()
  })
})
