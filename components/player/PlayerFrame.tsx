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
  rankProviders,
  readProviderHealth,
  recordProviderAttempt,
  recordProviderFailure,
  networkHint,
  startupDeadlineMs,
  type PlayerErrorCode,
} from '@/lib/player'
import { store, type UserSettings } from '@/lib/store'
import { reportPlayerEvent } from '@/lib/observability/client'
import {
  beginAttempt,
  exhaustAttempts,
  initialAttemptState,
  reloadAttempt,
  resumeOnline,
  setOffline,
  switchAttempt,
  transitionAttempt,
  isCurrentAttempt,
} from '@/lib/player-attempt'

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

type PlayerState = 'loading' | 'frame-loaded' | 'timeout-warning' | 'timeout' | 'error' | 'offline'

const TIMEOUT_WARNING_MS = 8_000
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
  src: _fallbackSrc,
}: PlayerFrameProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDERS[0].id)
  const [state, setState] = useState<PlayerState>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [errorCode, setErrorCode] = useState<PlayerErrorCode>('UNKNOWN')
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [subtitleLanguage, setSubtitleLanguage] = useState<UserSettings['subtitleLanguage']>(() => store.getSettings().subtitleLanguage)
  const [frameAttemptId, setFrameAttemptId] = useState(0)
  const startedAtRef = useRef(Date.now())
  const selectedProviderRef = useRef(selectedProvider)
  const attemptIdRef = useRef(0)
  const attemptStateRef = useRef(initialAttemptState)
  const attemptedProviderIdsRef = useRef<string[]>([])
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const settings = store.getSettings()
    const preferredProviderId = getInitialProviderId(settings.defaultServer)
    const initialProvider = settings.playerMode === 'manual'
      ? PROVIDERS.find((provider) => provider.id === preferredProviderId)
      : rankProviders({ health: readProviderHealth(), preferredProviderId })[0]
    if (initialProvider) setSelectedProvider(initialProvider.id)
    setSubtitleLanguage(settings.subtitleLanguage)
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
      const urlOptions = { subtitleLanguage }
      if (mediaType === 'movie') {
        return getMovieEmbedUrl(mediaId, providerId, urlOptions)
      }
      return getTVEmbedUrl(mediaId, season ?? 1, episode ?? 1, providerId, urlOptions)
    },
    [mediaId, mediaType, season, episode, subtitleLanguage],
  )

  const activeSrc = getEmbedUrl(selectedProvider)
  selectedProviderRef.current = selectedProvider

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
      attemptStateRef.current = setOffline(attemptStateRef.current)
      attemptIdRef.current = attemptStateRef.current.attemptId
      setState('offline')
      setErrorCode('NETWORK_OFFLINE')
    }
    const goOnline = () => {
      if (state === 'offline') {
        attemptedProviderIdsRef.current = []
        attemptStateRef.current = resumeOnline(attemptStateRef.current)
        attemptIdRef.current = attemptStateRef.current.attemptId
        setRetryCount((count) => count + 1)
        setState('loading')
      }
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        clearTimers()
        return
      }
      if (state === 'loading' && navigator.onLine) {
        clearTimers()
        attemptStateRef.current = resumeOnline(attemptStateRef.current)
        attemptIdRef.current = attemptStateRef.current.attemptId
        setRetryCount((count) => count + 1)
      }
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    document.addEventListener('visibilitychange', handleVisibility)
    if (!navigator.onLine) goOffline()
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [state])

  // Timeout timers
  // Deliberately depends only on attempt identity: warning-state renders must
  // not run cleanup and cancel the hard failover deadline.
  useEffect(() => {
    if (state !== 'loading') return
    attemptStateRef.current = beginAttempt(attemptStateRef.current, selectedProvider)
    const attemptId = attemptStateRef.current.attemptId
    attemptIdRef.current = attemptId
    setFrameAttemptId(attemptId)
    if (!attemptedProviderIdsRef.current.includes(selectedProvider)) {
      attemptedProviderIdsRef.current = [...attemptedProviderIdsRef.current, selectedProvider]
    }
    recordProviderAttempt(selectedProvider)
    reportPlayerEvent('player_attempt', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
    clearTimers()

    const hardDeadline = startupDeadlineMs()
    warningTimerRef.current = setTimeout(() => {
      if (attemptIdRef.current === attemptId) {
        attemptStateRef.current = transitionAttempt(attemptStateRef.current, attemptId, 'timeout-warning')
        setState('timeout-warning')
      }
    }, Math.min(TIMEOUT_WARNING_MS, Math.max(1_000, hardDeadline - 2_000)))

    hardTimerRef.current = setTimeout(() => {
      if (attemptIdRef.current !== attemptId) return
      attemptStateRef.current = transitionAttempt(attemptStateRef.current, attemptId, 'failed')
      recordProviderFailure(selectedProvider, 'timeout')
      reportPlayerEvent('player_timeout', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'startup-timeout', networkHint: networkHint() })
      setErrorCode('PLAYER_TIMEOUT')
      failoverToNextProvider()
    }, hardDeadline)

    return clearTimers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount, selectedProvider])

  const handleLoad = (providerId: string, attemptId: number) => {
    if (!isCurrentAttempt(attemptStateRef.current, attemptId, providerId)) return
    clearTimers()
    attemptStateRef.current = transitionAttempt(attemptStateRef.current, attemptId, 'frame-loaded')
    setState('frame-loaded')
    reportPlayerEvent('player_frame_loaded', { providerId, mediaType, startupMs: Date.now() - startedAtRef.current, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
    if (process.env.NODE_ENV === 'development') {
      console.debug('[veyra] player ready', {
        startupMs: Date.now() - startedAtRef.current,
        provider: selectedProvider,
        signal: 'FRAME_DOCUMENT_LOADED',
        networkHint: networkHint(),
        retryCount,
        src: activeSrc,
      })
    }
  }

  const handleError = (providerId: string, attemptId: number) => {
    if (!isCurrentAttempt(attemptStateRef.current, attemptId, providerId)) return
    clearTimers()
    recordProviderFailure(providerId, 'error')
    reportPlayerEvent('player_error', { providerId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'frame-error', networkHint: networkHint() })
    setErrorCode('PROVIDER_LOAD_ERROR')
    failoverToNextProvider()
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

  const reloadPlayer = () => {
    clearTimers()
    attemptStateRef.current = reloadAttempt(attemptStateRef.current)
    attemptIdRef.current = attemptStateRef.current.attemptId
    attemptedProviderIdsRef.current = []
    startedAtRef.current = Date.now()
    setErrorCode('UNKNOWN')
    setRetryCount((count) => count + 1)
    setState('loading')
  }

  const switchProvider = (providerId: string) => {
    if (providerId === selectedProvider) return
    clearTimers()
    attemptStateRef.current = switchAttempt(attemptStateRef.current, providerId)
    attemptIdRef.current = attemptStateRef.current.attemptId
    attemptedProviderIdsRef.current = attemptedProviderIdsRef.current.filter((id) => id !== providerId)
    setSelectedProvider(providerId)
    setRetryCount(0)
    setState('loading')
    reportPlayerEvent('player_manual_switch', { providerId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
    startedAtRef.current = Date.now()
  }

  const failoverToNextProvider = () => {
    const nextProvider = rankProviders({
      attemptedProviderIds: attemptedProviderIdsRef.current,
      health: readProviderHealth(),
      preferredProviderId: getInitialProviderId(store.getSettings().defaultServer),
    })[0]
    if (!nextProvider) {
      clearTimers()
      attemptStateRef.current = exhaustAttempts(attemptStateRef.current)
      setState('timeout')
      setErrorCode('STREAM_UNAVAILABLE')
      reportPlayerEvent('player_all_providers_exhausted', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'all-providers-failed' })
      return
    }
    reportPlayerEvent('player_auto_failover', { providerId: nextProvider.id, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'provider-failed', networkHint: networkHint() })
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
          <div role="group" aria-label="Playback servers" className="flex flex-wrap items-center gap-1.5">
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
          <span
            className="inline text-[11px] text-white/45"
            title="Resolution is controlled by the selected provider"
          >
            Quality: Provider controlled
          </span>
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
                <button
                  type="button"
                  onClick={reloadPlayer}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/40 transition-colors"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  Reload player
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
        {(state === 'loading' || state === 'timeout-warning' || state === 'frame-loaded') && (
          <div
            aria-live="polite"
            aria-label="Loading playback"
            className={`absolute inset-0 z-10 grid place-items-center bg-[#050507] ${state === 'frame-loaded' ? 'pointer-events-none bg-transparent' : ''}`}
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
              {state !== 'frame-loaded' && <div
                aria-hidden="true"
                className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-white/10 border-t-[#E50914] motion-reduce:animate-none"
              />}
              <p className="text-sm font-semibold text-white font-display">
                {state === 'frame-loaded'
                  ? 'Player loaded — playback is controlled by the provider.'
                  : state === 'timeout-warning'
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
              reducedMotion || state === 'frame-loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleLoad(selectedProvider, frameAttemptId)}
            onError={() => handleError(selectedProvider, frameAttemptId)}
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        )}
      </div>
    </div>
  )
}
