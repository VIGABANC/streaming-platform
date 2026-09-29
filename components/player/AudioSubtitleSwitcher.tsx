'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Captions, Volume2, Check, ChevronDown } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// AudioSubtitleSwitcher — popup menu for subtitle and audio track selection.
//
// Native sources:
//   - Subtitles: reads TextTrackList from the <video> element, plus "Off"
//   - Audio: reads AudioTrackList from the <video> element
// Iframe embeds (cross-origin):
//   - Subtitles: "Subtitle selection unavailable for this server"
//   - Audio: "Provider controlled" (disabled)
//
// Persists the user's choice per series in localStorage under
// `veyra_prefs_<seriesId>`.
// ─────────────────────────────────────────────────────────────────────────────

interface AudioSubtitleSwitcherProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  isNative: boolean
  seriesId?: string | number
}

interface TrackInfo {
  id: string
  label: string
  language: string
  enabled: boolean
}

export function AudioSubtitleSwitcher({ videoRef, isNative, seriesId }: AudioSubtitleSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [subtitleTracks, setSubtitleTracks] = useState<TrackInfo[]>([])
  const [audioTracks, setAudioTracks] = useState<TrackInfo[]>([])
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null)
  const [activeAudio, setActiveAudio] = useState<string | null>(null)
  const [crossOriginBlocked, setCrossOriginBlocked] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const prefsKey = seriesId != null ? `veyra_prefs_${seriesId}` : null

  const readPrefs = useCallback((): { subtitle?: string | null; audio?: string | null } => {
    if (!prefsKey) return {}
    try {
      const raw = localStorage.getItem(prefsKey)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }, [prefsKey])

  const writePrefs = useCallback((patch: { subtitle?: string | null; audio?: string | null }) => {
    if (!prefsKey) return
    try {
      const current = readPrefs()
      localStorage.setItem(prefsKey, JSON.stringify({ ...current, ...patch }))
    } catch { /* best effort */ }
  }, [prefsKey, readPrefs])

  // Sync tracks from the video element
  const syncTracks = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    try {
      // Subtitle tracks
      const subs: TrackInfo[] = []
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i]
        subs.push({
          id: `text-${i}`,
          label: track.label || track.language || `Track ${i + 1}`,
          language: track.language || '',
          enabled: track.mode === 'showing',
        })
      }
      setSubtitleTracks(subs)
      const showing = subs.find((s) => s.enabled)
      setActiveSubtitle(showing?.id ?? null)

      // Audio tracks (native only) — audioTracks is not in the TS DOM lib yet
      const audioTrackList = (video as HTMLVideoElement & { audioTracks?: ArrayLike<{ label: string; language: string; enabled: boolean }> }).audioTracks
      if (audioTrackList && audioTrackList.length > 0) {
        const audios: TrackInfo[] = []
        for (let i = 0; i < audioTrackList.length; i++) {
          const track = audioTrackList[i]
          audios.push({
            id: `audio-${i}`,
            label: track.label || track.language || `Audio ${i + 1}`,
            language: track.language || '',
            enabled: track.enabled,
          })
        }
        setAudioTracks(audios)
        const enabled = audios.find((a) => a.enabled)
        setActiveAudio(enabled?.id ?? null)
      }
      setCrossOriginBlocked(false)
    } catch {
      // Cross-origin taint or security error
      setCrossOriginBlocked(true)
    }
  }, [videoRef])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !isNative) return
    syncTracks()
    video.addEventListener('loadedmetadata', syncTracks)
    return () => video.removeEventListener('loadedmetadata', syncTracks)
  }, [isNative, syncTracks])

  // Apply persisted preferences when tracks load
  useEffect(() => {
    if (!isNative || subtitleTracks.length === 0) return
    const prefs = readPrefs()
    if (prefs.subtitle === null) {
      // Explicitly off
      const video = videoRef.current
      if (video) for (let i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = 'disabled'
      setActiveSubtitle(null)
    } else if (prefs.subtitle) {
      const trackIndex = subtitleTracks.findIndex((t) => t.language === prefs.subtitle || t.id === prefs.subtitle)
      if (trackIndex >= 0) {
        const video = videoRef.current
        if (video) {
          for (let i = 0; i < video.textTracks.length; i++) {
            video.textTracks[i].mode = i === trackIndex ? 'showing' : 'disabled'
          }
          setActiveSubtitle(subtitleTracks[trackIndex].id)
        }
      }
    }
  }, [isNative, subtitleTracks, readPrefs, videoRef])

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return
    const handlePointer = (e: MouseEvent) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const selectSubtitle = (trackId: string | null) => {
    if (!isNative) return
    const video = videoRef.current
    if (!video) return
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = trackId === `text-${i}` ? 'showing' : 'disabled'
    }
    setActiveSubtitle(trackId)
    const track = trackId ? subtitleTracks.find((t) => t.id === trackId) : null
    writePrefs({ subtitle: track?.language ?? null })
  }

  const selectAudio = (trackId: string) => {
    if (!isNative) return
    const video = videoRef.current
    if (!video) return
    const audioTrackList = (video as HTMLVideoElement & { audioTracks?: ArrayLike<{ enabled: boolean }> }).audioTracks
    if (!audioTrackList) return
    for (let i = 0; i < audioTrackList.length; i++) {
      (audioTrackList[i] as { enabled: boolean }).enabled = trackId === `audio-${i}`
    }
    setActiveAudio(trackId)
    const track = audioTracks.find((t) => t.id === trackId)
    writePrefs({ audio: track?.language ?? null })
  }

  // Arrow key navigation within the menu
  const handleMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"], [role="menuitem"]')
      if (!items || items.length === 0) return
      const arr = Array.from(items)
      const currentIndex = arr.findIndex((el) => el === document.activeElement)
      const next = e.key === 'ArrowDown'
        ? (currentIndex + 1) % arr.length
        : (currentIndex - 1 + arr.length) % arr.length
      arr[next]?.focus()
    }
  }

  const hasSubtitles = subtitleTracks.length > 0
  const hasAudio = audioTracks.length > 0

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Audio and subtitle settings"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-full p-1.5 transition-colors hover:bg-white/10 ${
          open ? 'bg-white/10' : ''
        }`}
        title="Audio & subtitles"
      >
        <Captions size={16} className={activeSubtitle ? 'text-primary' : 'text-white/70'} />
        <ChevronDown size={10} className="text-white/50" />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Audio and subtitle options"
          onKeyDown={handleMenuKeyDown}
          className="absolute bottom-full right-0 z-30 mb-2 w-56 rounded-xl border border-white/10 bg-[#111] p-2 shadow-2xl backdrop-blur-md"
        >
          {/* Subtitles section */}
          <div className="mb-2">
            <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
              <Captions size={11} />
              Subtitles
            </p>
            {!isNative || crossOriginBlocked ? (
              <p className="px-2 py-1.5 text-[11px] italic text-white/40">
                {crossOriginBlocked
                  ? 'Subtitle selection unavailable for this server'
                  : 'Subtitle selection unavailable for this server'}
              </p>
            ) : !hasSubtitles ? (
              <p className="px-2 py-1.5 text-[11px] italic text-white/40">No subtitle tracks available</p>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeSubtitle === null}
                  onClick={() => selectSubtitle(null)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-white/80 hover:bg-white/5 transition-colors"
                >
                  <span>Off</span>
                  {activeSubtitle === null && <Check size={12} className="text-primary" />}
                </button>
                {subtitleTracks.map((track) => (
                  <button
                    key={track.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={activeSubtitle === track.id}
                    onClick={() => selectSubtitle(track.id)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-white/80 hover:bg-white/5 transition-colors"
                  >
                    <span>{track.label}</span>
                    {activeSubtitle === track.id && <Check size={12} className="text-primary" />}
                  </button>
                ))}
              </>
            )}
          </div>
          {/* Divider */}
          <div className="border-t border-white/10" />
          {/* Audio section */}
          <div className="mt-2">
            <p className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
              <Volume2 size={11} />
              Audio
            </p>
            {!isNative ? (
              <p className="px-2 py-1.5 text-[11px] italic text-white/40">Provider controlled</p>
            ) : !hasAudio ? (
              <p className="px-2 py-1.5 text-[11px] italic text-white/40">No alternate audio tracks</p>
            ) : (
              audioTracks.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={activeAudio === track.id}
                  onClick={() => selectAudio(track.id)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-[11px] text-white/80 hover:bg-white/5 transition-colors"
                >
                  <span>{track.label}</span>
                  {activeAudio === track.id && <Check size={12} className="text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
