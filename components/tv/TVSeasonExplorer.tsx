'use client'

import { useState } from 'react'
import { SeasonSelector } from './SeasonSelector'
import { EpisodeList } from './EpisodeList'
import type { Season, Episode } from '@/lib/tmdb'

interface TVSeasonExplorerProps {
  showId: string | number
  seasons: Season[]
  initialSeasonNumber: number
  initialEpisodes: Episode[]
}

export function TVSeasonExplorer({
  showId,
  seasons,
  initialSeasonNumber,
  initialEpisodes,
}: TVSeasonExplorerProps) {
  const [activeSeason, setActiveSeason] = useState(initialSeasonNumber)
  const [episodes, setEpisodes] = useState<Episode[]>(initialEpisodes)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSeasonChange = async (seasonNum: number) => {
    setActiveSeason(seasonNum)
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/tv/${showId}/season/${seasonNum}`)
      if (!res.ok) {
        throw new Error('Failed to load season episodes')
      }
      const data = await res.json()
      setEpisodes(data.episodes ?? [])
    } catch {
      setError('Could not load episodes for this season. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Episodes</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a season to view episodes and start streaming.
          </p>
        </div>

        {seasons.length > 0 && (
          <SeasonSelector
            seasons={seasons}
            activeSeason={activeSeason}
            onSeasonChange={handleSeasonChange}
          />
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 py-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex gap-4 rounded-xl bg-surface/50 p-3 animate-pulse"
            >
              <div className="aspect-video w-36 rounded-lg bg-white/10" />
              <div className="flex-1 space-y-2 py-2">
                <div className="h-4 w-1/3 rounded bg-white/10" />
                <div className="h-3 w-1/4 rounded bg-white/5" />
                <div className="h-3 w-3/4 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <p className="text-sm text-white">{error}</p>
          <button
            type="button"
            onClick={() => handleSeasonChange(activeSeason)}
            className="mt-3 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Retry
          </button>
        </div>
      ) : (
        <EpisodeList
          showId={showId}
          season={activeSeason}
          episodes={episodes}
        />
      )}
    </div>
  )
}
