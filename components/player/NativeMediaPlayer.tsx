'use client'

import { useRef } from 'react'
import type { PlaybackSource } from '@/lib/player'

interface NativeMediaPlayerProps {
  source: PlaybackSource
  title: string
  onReady: () => void
  onStarted: () => void
  onEnded: () => void
  onError: () => void
  onProgress?: (positionSeconds: number, durationSeconds: number) => void
}

export function NativeMediaPlayer({ source, title, onReady, onStarted, onEnded, onError, onProgress }: NativeMediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  return (
    <video
      ref={videoRef}
      className="h-full w-full bg-black object-contain"
      controls
      controlsList="nodownload"
      playsInline
      preload="metadata"
      aria-label={`${title} native playback`}
      onPlay={onStarted}
      onLoadedMetadata={onReady}
      onEnded={onEnded}
      onError={onError}
      onTimeUpdate={(event) => {
        const video = event.currentTarget
        onProgress?.(video.currentTime, video.duration)
      }}
    >
      <source src={source.url} />
      Your browser does not support native video playback.
    </video>
  )
}
