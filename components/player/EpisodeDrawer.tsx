'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ChevronDown, Check, Play, Clock } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// EpisodeDrawer — slide-out panel from the right for series/anime navigation.
//
// Features:
//   - Season selector (dropdown)
//   - Episode rows with thumbnail (16:9), number, title, synopsis (2-line clamp),
//     duration, watched indicator
//   - Active episode highlighted with red accent
//   - Click swaps source in place (no full page reload) via onEpisodeSelect
//   - Close via X, Esc, or click outside
//   - Focus trap while open; focus restored to trigger on close
//   - Keyboard: ↑/↓ navigate episodes, Enter selects
//   - Mobile: full-height sheet
// ─────────────────────────────────────────────────────────────────────────────

export interface EpisodeInfo {
  episodeNumber: number
  name: string
  overview?: string
  runtime?: number
  stillPath?: string | null
  watched?: boolean
}

export interface SeasonInfo {
  seasonNumber: number
  name: string
  episodeCount: number
  episodes: EpisodeInfo[]
}

interface EpisodeDrawerProps {
  open: boolean
  onClose: () => void
  seasons: SeasonInfo[]
  currentSeason: number
  currentEpisode: number
  onEpisodeSelect: (season: number, episode: number) => void
  triggerRef?: React.RefObject<HTMLElement | null>
  posterBaseUrl?: string
}

function formatRuntime(minutes?: number): string {
  if (!minutes) return ''
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function EpisodeDrawer({
  open,
  onClose,
  seasons,
  currentSeason,
  currentEpisode,
  onEpisodeSelect,
  triggerRef,
  posterBaseUrl = 'https://image.tmdb.org/t/p/w300',
}: EpisodeDrawerProps) {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason)
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const backdropRef = useRef<HTMLDivElement | null>(null)

  const activeSeason = seasons.find((s) => s.seasonNumber === selectedSeason) ?? seasons[0]
  const episodes = activeSeason?.episodes ?? []

  // Reset focused index when season changes
  useEffect(() => {
    const currentIdx = episodes.findIndex((e) => e.episodeNumber === currentEpisode)
    setFocusedIndex(currentIdx >= 0 ? currentIdx : 0)
  }, [selectedSeason, currentEpisode, episodes])

  // Focus trap and Esc handling
  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (panel) {
      // Focus the first focusable element
      const focusable = panel.querySelector<HTMLElement>('[data-episode-row="true"], button')
      focusable?.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
        return
      }
      // Trap Tab within panel
      if (e.key === 'Tab') {
        if (!panel) return
        const focusableEls = panel.querySelectorAll<HTMLElement>(
          'button, [data-episode-row="true"], [tabindex]:not([tabindex="-1"])',
        )
        if (focusableEls.length === 0) return
        const first = focusableEls[0]
        const last = focusableEls[focusableEls.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
      // Arrow up/down to navigate episodes
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const dir = e.key === 'ArrowDown' ? 1 : -1
        const next = Math.min(episodes.length - 1, Math.max(0, focusedIndex + dir))
        setFocusedIndex(next)
        const rows = panel?.querySelectorAll<HTMLElement>('[data-episode-row="true"]')
        rows?.[next]?.focus()
      }
      if (e.key === 'Enter') {
        const ep = episodes[focusedIndex]
        if (ep) {
          onEpisodeSelect(selectedSeason, ep.episodeNumber)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, episodes, focusedIndex, selectedSeason, currentEpisode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    onClose()
    triggerRef?.current?.focus()
  }, [onClose, triggerRef])

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose()
  }

  if (!open) return null

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      aria-hidden="false"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Episode list"
        className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-[#111] shadow-2xl sm:w-[400px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Season selector dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="Select season"
                aria-expanded={seasonDropdownOpen}
                aria-haspopup="listbox"
                onClick={() => setSeasonDropdownOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
              >
                <span>{activeSeason?.name ?? `Season ${selectedSeason}`}</span>
                <ChevronDown size={14} className="text-white/60" />
              </button>
              {seasonDropdownOpen && (
                <ul
                  role="listbox"
                  className="absolute left-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-white/10 bg-[#1a1a1a] py-1 shadow-2xl"
                >
                  {seasons.map((s) => (
                    <li key={s.seasonNumber} role="option" aria-selected={s.seasonNumber === selectedSeason}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeason(s.seasonNumber)
                          setSeasonDropdownOpen(false)
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors ${
                          s.seasonNumber === selectedSeason
                            ? 'text-primary'
                            : 'text-white/80 hover:bg-white/5'
                        }`}
                      >
                        <span>{s.name}</span>
                        {s.seasonNumber === selectedSeason && <Check size={12} />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <span className="text-xs text-white/40">{episodes.length} episodes</span>
          </div>
          <button
            type="button"
            aria-label="Close episode list"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Episode list */}
        <div className="flex-1 overflow-y-auto">
          {episodes.map((ep, index) => {
            const isActive = ep.episodeNumber === currentEpisode && selectedSeason === currentSeason
            const isFocused = index === focusedIndex
            const stillSrc = ep.stillPath ? `${posterBaseUrl}${ep.stillPath}` : null
            return (
              <button
                key={ep.episodeNumber}
                type="button"
                data-episode-row="true"
                aria-label={`Episode ${ep.episodeNumber}: ${ep.name}`}
                aria-current={isActive ? 'true' : undefined}
                tabIndex={isFocused ? 0 : -1}
                onClick={() => onEpisodeSelect(selectedSeason, ep.episodeNumber)}
                className={`flex w-full gap-3 border-b border-white/5 p-3 text-left transition-colors ${
                  isActive
                    ? 'bg-primary/10 ring-1 ring-inset ring-primary/40'
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Thumbnail 16:9 */}
                <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a]">
                  {stillSrc ? (
                    <Image
                      src={stillSrc}
                      alt={`Episode ${ep.episodeNumber}`}
                      fill
                      loading="lazy"
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-sm font-bold text-white/20">E{ep.episodeNumber}</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play size={16} fill="white" className="text-white" />
                    </div>
                  )}
                  {ep.watched && !isActive && (
                    <div className="absolute bottom-1 right-1 rounded-full bg-primary px-1 py-0.5">
                      <Check size={8} className="text-white" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-white/80'}`}>
                      E{ep.episodeNumber}
                    </span>
                    {ep.runtime && (
                      <span className="flex items-center gap-0.5 text-[10px] text-white/40">
                        <Clock size={9} />
                        {formatRuntime(ep.runtime)}
                      </span>
                    )}
                  </div>
                  <p className={`mt-0.5 truncate text-xs font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                    {ep.name}
                  </p>
                  {ep.overview && (
                    <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/40">
                      {ep.overview}
                    </p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
