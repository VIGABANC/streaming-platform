'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Captions, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import type { PlaybackSource } from '@/lib/player'

const VOLUME_KEY = 'veyra-player-volume'
const MUTED_KEY = 'veyra-player-muted'
const CAPTIONS_KEY = 'veyra-player-captions'

function readNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  const parsed = raw == null ? NaN : Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function readFlag(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  return raw == null ? fallback : raw === '1'
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`
}

interface NativeMediaPlayerProps {
  source: PlaybackSource
  title: string
  onReady: () => void
  onStarted: () => void
  onEnded: () => void
  onError: () => void
  onProgress?: (positionSeconds: number, durationSeconds: number) => void
  registerVideo?: (element: HTMLVideoElement | null) => void
}

export function NativeMediaPlayer({
  source,
  title,
  onReady,
  onStarted,
  onEnded,
  onError,
  onProgress,
  registerVideo,
}: NativeMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)
  const [volume, setVolume] = useState(() => readNumber(VOLUME_KEY, 1))
  const [isMuted, setIsMuted] = useState(() => readFlag(MUTED_KEY, false))
  const [captionsOn, setCaptionsOn] = useState(() => readFlag(CAPTIONS_KEY, false))
  const [hasCaptions, setHasCaptions] = useState(false)
  const [hover, setHover] = useState<{ ratio: number; time: number } | null>(null)

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element
    registerVideo?.(element)
  }, [registerVideo])

  // Restore persisted preferences and watch for tracks appearing.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = Math.min(1, Math.max(0, volume))
    video.muted = isMuted
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const syncCaptions = useCallback((show: boolean) => {
    const video = videoRef.current
    if (!video) return
    const tracks = video.textTracks
    setHasCaptions(tracks.length > 0)
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = show && i === 0 ? 'showing' : 'disabled'
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const syncTracks = () => syncCaptions(captionsOn)
    video.addEventListener('loadedmetadata', syncTracks)
    video.addEventListener('enterpictureinpicture', syncTracks)
    return () => {
      video.removeEventListener('loadedmetadata', syncTracks)
      video.removeEventListener('enterpictureinpicture', syncTracks)
    }
  }, [captionsOn, syncCaptions])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    if (!video.muted && video.volume === 0) {
      video.volume = 0.5
      setVolume(0.5)
    }
  }

  const changeVolume = (next: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = Math.min(1, Math.max(0, next))
    if (video.muted && next > 0) video.muted = false
  }

  const toggleCaptions = () => {
    const video = videoRef.current
    if (!video || video.textTracks.length === 0) return
    const next = !captionsOn
    setCaptionsOn(next)
    window.localStorage.setItem(CAPTIONS_KEY, next ? '1' : '0')
    syncCaptions(next)
  }

  const seekFromEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    video.currentTime = ratio * video.duration
    setCurrentTime(video.currentTime)
  }

  const previewFromEvent = (event: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setHover({ ratio, time: ratio * video.duration })
  }

  const updateBuffered = () => {
    const video = videoRef.current
    if (!video) return
    for (let i = video.buffered.length - 1; i >= 0; i--) {
      if (video.buffered.start(i) <= video.currentTime) {
        setBufferedEnd(video.buffered.end(i))
        return
      }
    }
  }

  const scrubRatio = duration > 0 ? currentTime / duration : 0
  const bufferedRatio = duration > 0 ? Math.min(1, bufferedEnd / duration) : 0

  return (
    <div className="group/player relative h-full w-full bg-black">
      <video
        ref={setVideoRef}
        className="h-full w-full bg-black object-contain"
        controlsList="nodownload"
        playsInline
        preload="metadata"
        aria-label={`${title} native playback`}
        onPlay={() => { setIsPlaying(true); onStarted() }}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          const video = videoRef.current
          if (video) setDuration(video.duration)
          syncCaptions(captionsOn)
          onReady()
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget
          setCurrentTime(video.currentTime)
          updateBuffered()
          onProgress?.(video.currentTime, video.duration)
        }}
        onProgress={updateBuffered}
        onEnded={() => { setIsPlaying(false); onEnded() }}
        onError={onError}
        onVolumeChange={(event) => {
          const video = event.currentTarget
          setVolume(video.volume)
          setIsMuted(video.muted)
          window.localStorage.setItem(VOLUME_KEY, String(video.volume))
          window.localStorage.setItem(MUTED_KEY, video.muted ? '1' : '0')
        }}
      >
        <source src={source.url} />
        Your browser does not support native video playback.
      </video>

      {/* Custom control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-2 pt-8 transition-opacity duration-200 ${
          isPlaying ? 'opacity-0 group-hover/player:opacity-100 focus-within:opacity-100' : 'opacity-100'
        }`}
      >
        {/* Scrubber with buffered range and hover time preview */}
        <div
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          className="relative mb-2 h-4 cursor-pointer"
          onClick={seekFromEvent}
          onMouseMove={previewFromEvent}
          onMouseLeave={() => setHover(null)}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/40" style={{ width: `${bufferedRatio * 100}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${scrubRatio * 100}%` }}>
              <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-primary shadow" />
            </div>
          </div>
          {hover && (
            <div
              className="pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded bg-black/85 px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style={{ left: `${hover.ratio * 100}%` }}
            >
              {formatTime(hover.time)}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-white">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
          >
            {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
          </button>
          <span className="text-[11px] font-medium tabular-nums text-white/90">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="ml-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              aria-pressed={isMuted}
              className="rounded-full p-1.5 hover:bg-white/10 transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            {/* Volume slider is replaced by the mute toggle on mobile */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              aria-label="Volume"
              className="hidden h-1 w-16 cursor-pointer accent-white sm:block"
            />
          </div>

          {hasCaptions && (
            <button
              type="button"
              onClick={toggleCaptions}
              aria-label={captionsOn ? 'Turn captions off' : 'Turn captions on'}
              aria-pressed={captionsOn}
              className={`rounded-full p-1.5 transition-colors hover:bg-white/10 ${captionsOn ? 'text-primary' : 'text-white/70'}`}
            >
              <Captions size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
