'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Season } from '@/lib/tmdb'

interface SeasonSelectorProps {
  seasons: Season[]
  activeSeason: number
  onSeasonChange: (season: number) => void
}

export function SeasonSelector({ seasons, activeSeason, onSeasonChange }: SeasonSelectorProps) {
  const [open, setOpen] = useState(false)

  // Show regular seasons first; specials (season 0) at the bottom
  const regularSeasons = seasons.filter((s) => s.season_number > 0)
  const specials = seasons.filter((s) => s.season_number === 0)
  const orderedSeasons = [...regularSeasons, ...specials]

  const active = seasons.find((s) => s.season_number === activeSeason)

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select season"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-surface px-4 py-2.5 text-sm font-semibold text-white hover:border-primary transition-colors"
      >
        <span>{active?.name ?? `Season ${activeSeason}`}</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Season"
          className="absolute left-0 top-full mt-2 z-30 max-h-64 w-56 overflow-y-auto rounded-xl border border-white/10 bg-[#0F1020] py-1.5 shadow-2xl"
        >
          {orderedSeasons.map((season) => (
            <li
              key={season.id}
              role="option"
              aria-selected={season.season_number === activeSeason}
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                season.season_number === activeSeason
                  ? 'bg-primary/10 text-primary'
                  : 'text-white hover:bg-white/8'
              }`}
              onClick={() => {
                onSeasonChange(season.season_number)
                setOpen(false)
              }}
            >
              <span>{season.name}</span>
              <span className="text-xs text-muted-foreground">
                {season.episode_count} ep
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Backdrop to close */}
      {open && (
        <div
          className="fixed inset-0 z-20"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
