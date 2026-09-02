'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { X, AlertCircle, Wifi, WifiOff, RotateCcw, ArrowLeft } from 'lucide-react'
import { warmPlayerConnection, playerErrorMessage, type PlayerErrorCode } from '@/lib/player'

interface PlayerFrameProps {
  src: string
  title?: string
  artwork?: string
  episodeLabel?: string
  backHref?: string
}

type PlayerState = 'loading' | 'loaded' | 'timeout-warning' | 'timeout' | 'error' | 'offline'

const TIMEOUT_WARNING_MS = 10_000
const TIMEOUT_HARD_MS = 25_000
const MAX_RETRIES = 3

export function PlayerFrame({
  src,
  title = 'VEYRA video player',
  artwork,
  episodeLabel,
  backHref = '/',
}: PlayerFrameProps) {
  const [state, setState] = useState<PlayerState>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [errorCode, setErrorCode] = useState<PlayerErrorCode>('UNKNOWN')
  const startedAtRef = useRef(Date.now())
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (hardTimerRef.current) clearTimeout(hardTimerRef.current)
  }

  // Warm provider connection on mount
  useEffect(() => {
    warmPlayerConnection()
  }, [])

  // Offline detection
  useEffect(() => {
    const goOffline = () => {
      clearTimers()
      setState('offline')
      setErrorCode('NETWORK_OFFLINE')
    }
    const goOnline = () => {
      if (state === 'offline') setState('loading')
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [state])

  // Timeout timers
  useEffect(() => {
    if (state !== 'loading') return
    clearTimers()

    warningTimerRef.current = setTimeout(() => {
      setState('timeout-warning')
    }, TIMEOUT_WARNING_MS)

    hardTimerRef.current = setTimeout(() => {
      clearTimers()
      setState('timeout')
      setErrorCode('PLAYER_TIMEOUT')
    }, TIMEOUT_HARD_MS)

    return clearTimers
  }, [state, retryCount])

  const handleLoad = () => {
    clearTimers()
    setState('loaded')
    // Telemetry
    if (process.env.NODE_ENV === 'development') {
      console.debug('[veyra] player ready', {
        startupMs: Date.now() - startedAtRef.current,
        retryCount,
        src,
      })
    }
  }

  const handleError = () => {
    clearTimers()
    setErrorCode('PROVIDER_LOAD_ERROR')
    setState('error')
  }

  const retry = () => {
    if (retryCount >= MAX_RETRIES) {
      setState('error')
      setErrorCode('PROVIDER_LOAD_ERROR')
      return
    }
    startedAtRef.current = Date.now()
    clearTimers()
    setRetryCount((c) => c + 1)
    setState('loading')
  }

  const isError = state === 'error' || state === 'timeout' || state === 'offline'

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
      {/* Error / offline state */}
      {isError && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/80">
          {artwork && (
            <img
              src={artwork}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-15 blur-sm"
            />
          )}
          <div className="relative z-10 max-w-sm p-8 text-center">
            {state === 'offline' ? (
              <WifiOff size={32} className="mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <AlertCircle size={32} className="mx-auto mb-4 text-primary" aria-hidden="true" />
            )}
            <h2 className="font-bold text-white font-display">
              {state === 'offline' ? "You're offline" : 'Playback error'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {playerErrorMessage(errorCode)}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {retryCount < MAX_RETRIES && (
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Retry
                </button>
              )}
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-primary hover:text-primary transition-colors"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Go back
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {(state === 'loading' || state === 'timeout-warning') && (
        <div
          aria-live="polite"
          aria-label="Loading playback"
          className="absolute inset-0 z-10 grid place-items-center bg-black"
        >
          {artwork && (
            <img
              src={artwork}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}
          <div className="relative z-10 text-center px-6">
            <div
              aria-hidden="true"
              className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-white/20 border-t-primary"
            />
            <p className="text-sm font-medium text-white">
              {state === 'timeout-warning'
                ? 'Playback is taking longer than expected…'
                : 'Preparing playback…'}
            </p>
            {episodeLabel && (
              <p className="mt-1 text-xs text-white/50">{episodeLabel}</p>
            )}
            {state === 'timeout-warning' && (
              <button
                type="button"
                onClick={retry}
                className="mt-4 text-xs text-primary underline underline-offset-4 hover:no-underline"
              >
                Retry now
              </button>
            )}
          </div>
        </div>
      )}

      {/* Iframe */}
      {!isError && (
        <iframe
          key={retryCount}
          title={title}
          src={src}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className={`h-full w-full transition-opacity duration-500 ${
            state === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox"
        />
      )}
    </div>
  )
}
