'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  WifiOff,
  RotateCcw,
  ArrowLeft,
  Server,
  Sparkles,
  Maximize2,
  Check,
} from 'lucide-react'
import {
  warmPlayerConnection,
  playerErrorMessage,
  PROVIDERS,
  getInitialProviderId,
  getMovieEmbedUrl,
  getTVEmbedUrl,
  type PlayerErrorCode,
} from '@/lib/player'
import { store } from '@/lib/store'

interface PlayerFrameProps {
  mediaType: 'movie' | 'tv'
  mediaId: string | number
  season?: string | number
  episode?: string | number
  title?: string
  artwork?: string
  episodeLabel?: string
  backHref?: string
  /** Fallback URL if mediaId builder is not used */
  src?: string
}

type PlayerState = 'loading' | 'loaded' | 'timeout-warning' | 'timeout' | 'error' | 'offline'

const TIMEOUT_WARNING_MS = 8_000
const TIMEOUT_HARD_MS = 20_000
const MAX_RETRIES = 3

export function PlayerFrame({
  mediaType,
  mediaId,
  season,
  episode,
  title = 'VEYRA video player',
  artwork,
  episodeLabel,
  backHref = '/',
  src: fallbackSrc,
}: PlayerFrameProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDERS[0].id)
  const [state, setState] = useState<PlayerState>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [errorCode, setErrorCode] = useState<PlayerErrorCode>('UNKNOWN')
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const startedAtRef = useRef(Date.now())
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const settings = store.getSettings()
    setSelectedProvider(getInitialProviderId(settings.defaultServer))
    setIsCinemaMode(settings.ambientLighting)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(settings.reducedMotion || mediaQuery.matches)
    updateMotion()
    mediaQuery.addEventListener?.('change', updateMotion)
    return () => mediaQuery.removeEventListener?.('change', updateMotion)
  }, [])

  // Compute active embed source
  const getEmbedUrl = useCallback(
    (providerId: string) => {
      if (fallbackSrc && !mediaId) return fallbackSrc
      if (mediaType === 'movie') {
        return getMovieEmbedUrl(mediaId, providerId)
      }
      return getTVEmbedUrl(mediaId, season ?? 1, episode ?? 1, providerId)
    },
    [fallbackSrc, mediaId, mediaType, season, episode],
  )

  const activeSrc = getEmbedUrl(selectedProvider)

  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (hardTimerRef.current) clearTimeout(hardTimerRef.current)
  }

  // Warm only the selected provider after playback is requested.
  useEffect(() => {
    warmPlayerConnection(selectedProvider)
  }, [selectedProvider])

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
  }, [state, retryCount, selectedProvider])

  const handleLoad = () => {
    clearTimers()
    setState('loaded')
    if (process.env.NODE_ENV === 'development') {
      console.debug('[veyra] player ready', {
        startupMs: Date.now() - startedAtRef.current,
        provider: selectedProvider,
        retryCount,
        src: activeSrc,
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
      // Auto failover to next provider
      failoverToNextProvider()
      return
    }
    startedAtRef.current = Date.now()
    clearTimers()
    setRetryCount((c) => c + 1)
    setState('loading')
  }

  const switchProvider = (providerId: string) => {
    if (providerId === selectedProvider) return
    clearTimers()
    setSelectedProvider(providerId)
    setRetryCount(0)
    setState('loading')
    startedAtRef.current = Date.now()
  }

  const failoverToNextProvider = () => {
    const currentIndex = PROVIDERS.findIndex((p) => p.id === selectedProvider)
    const nextIndex = (currentIndex + 1) % PROVIDERS.length
    const nextProvider = PROVIDERS[nextIndex]
    switchProvider(nextProvider.id)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const isError = state === 'error' || state === 'timeout' || state === 'offline'
  const activeProviderObj = PROVIDERS.find((p) => p.id === selectedProvider) ?? PROVIDERS[0]

  return (
    <div className="space-y-3">
      {/* Top Stream Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/8 bg-[#0A0D14]/90 p-2 px-3 text-xs backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-white/80">
            <Server size={13} className="text-primary" />
            <span>Server:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {PROVIDERS.map((p) => {
              const isActive = p.id === selectedProvider
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => switchProvider(p.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isActive && <Check size={11} />}
                  <span>{p.name.replace(/\(.*\)/, '').trim()}</span>
                  <span
                    className={`rounded px-1 py-0.2 text-[9px] uppercase font-bold tracking-tight ${
                      isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-white/50'
                    }`}
                  >
                    {p.badge}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCinemaMode((prev) => {
              const next = !prev
              store.updateSettings({ ambientLighting: next })
              return next
            })}
            className={`hidden sm:inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${
              isCinemaMode
                ? 'bg-accent/20 text-accent font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle cinema lighting"
          >
            <Sparkles size={12} />
            <span>Lights {isCinemaMode ? 'Off' : 'On'}</span>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Full screen player"
          >
            <Maximize2 size={12} />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Video Frame */}
      <div
        ref={containerRef}
        className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl transition-all ${
          isCinemaMode ? 'ring-2 ring-primary/40 shadow-primary/10' : 'ring-1 ring-white/10'
        }`}
      >
        {/* Error / offline state */}
        {isError && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/85 backdrop-blur-sm">
            {artwork && (
              <img
                src={artwork}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 blur-md"
              />
            )}
            <div className="relative z-10 max-w-md p-8 text-center">
              {state === 'offline' ? (
                <WifiOff size={36} className="mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <AlertCircle size={36} className="mx-auto mb-4 text-primary" aria-hidden="true" />
              )}
              <h2 className="text-lg font-bold text-white font-display">
                {state === 'offline' ? "You're offline" : 'Stream Unavailable on This Server'}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {playerErrorMessage(errorCode)}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={failoverToNextProvider}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  <Server size={13} aria-hidden="true" />
                  Try Next Server
                </button>
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/40 transition-colors"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  Retry ({MAX_RETRIES - retryCount} left)
                </button>
                <Link
                  href={backHref}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white transition-colors"
                >
                  <ArrowLeft size={13} aria-hidden="true" />
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
            className="absolute inset-0 z-10 grid place-items-center bg-[#050507]"
          >
            {artwork && (
              <img
                src={artwork}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 filter blur-sm"
              />
            )}
            <div className="relative z-10 text-center px-6">
              <div
                aria-hidden="true"
                className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-white/10 border-t-[#E50914] motion-reduce:animate-none"
              />
              <p className="text-sm font-semibold text-white font-display">
                {state === 'timeout-warning'
                  ? 'Connecting to stream…'
                  : `Connecting to ${activeProviderObj.name}…`}
              </p>
              {episodeLabel && (
                <p className="mt-1 text-xs text-primary/80 font-medium">{episodeLabel}</p>
              )}
              {state === 'timeout-warning' && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={failoverToNextProvider}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/40 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Server size={12} />
                    Switch to next server
                  </button>
                  <button
                    type="button"
                    onClick={retry}
                    className="text-xs text-muted-foreground underline underline-offset-4 hover:text-white"
                  >
                    Keep waiting
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Iframe */}
        {!isError && (
          <iframe
            key={`${selectedProvider}-${retryCount}`}
            title={title}
            src={activeSrc}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className={`h-full w-full ${reducedMotion ? 'opacity-100' : 'transition-opacity duration-500'} ${
              reducedMotion || state === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation allow-popups-to-escape-sandbox"
          />
        )}
      </div>
    </div>
  )
}
