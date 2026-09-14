'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  WifiOff,
  RotateCcw,
  ArrowLeft,
  Server,
  Sparkles,
  Maximize2,
  RectangleHorizontal,
  Check,
} from 'lucide-react'
import {
  warmPlayerConnection,
  playerErrorMessage,
  PROVIDERS,
  getInitialProviderId,
  rankProviders,
  readProviderHealth,
  recordProviderAttempt,
  recordProviderFailure,
  networkHint,
  startupDeadlineMs,
  type PlayerErrorCode,
  type PlaybackMediaType,
  type PlaybackSource,
} from '@/lib/player'
import { resolvePlaybackSources } from '@/lib/playback-resolver'
import { NativeMediaPlayer } from '@/components/player/NativeMediaPlayer'
import { store } from '@/lib/store'
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
  mediaType: PlaybackMediaType
  mediaId: string | number
  season?: string | number
  episode?: string | number
  title?: string
  artwork?: string
  episodeLabel?: string
  backHref?: string
  nativeSources?: PlaybackSource[]
}

type PlayerState = 'loading' | 'frame-loaded' | 'timeout-warning' | 'timeout' | 'error' | 'offline'

const TIMEOUT_WARNING_MS = 8_000
const MAX_RETRIES = 3
const EMPTY_SOURCES: PlaybackSource[] = []

export function PlayerFrame({
  mediaType,
  mediaId,
  season,
  episode,
  title = 'VEYRA video player',
  artwork,
  episodeLabel,
  backHref = '/',
  nativeSources = EMPTY_SOURCES,
}: PlayerFrameProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDERS[0].id)
  const [state, setState] = useState<PlayerState>('loading')
  const [retryCount, setRetryCount] = useState(0)
  const [errorCode, setErrorCode] = useState<PlayerErrorCode>('UNKNOWN')
  const [isCinemaMode, setIsCinemaMode] = useState(false)
  const [isTheaterMode, setIsTheaterMode] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [frameAttemptId, setFrameAttemptId] = useState(0)
  const startedAtRef = useRef(Date.now())
  const attemptIdRef = useRef(0)
  const attemptStateRef = useRef(initialAttemptState)
  const attemptedProviderIdsRef = useRef<string[]>([])
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const settings = store.getSettings()
    const preferredProviderId = getInitialProviderId(settings.defaultServer)
    const initialProvider = rankProviders({ health: readProviderHealth(), preferredProviderId })[0]
    if (initialProvider) setSelectedProvider(initialProvider.id)
    setIsCinemaMode(settings.ambientLighting)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(settings.reducedMotion || mediaQuery.matches)
    updateMotion()
    mediaQuery.addEventListener?.('change', updateMotion)
    return () => mediaQuery.removeEventListener?.('change', updateMotion)
  }, [])

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return
      if (event.key.toLowerCase() === 't') setIsTheaterMode((current) => !current)
      if (event.key.toLowerCase() === 'l') setIsCinemaMode((current) => {
        const next = !current
        store.updateSettings({ ambientLighting: next })
        return next
      })
      if (event.key.toLowerCase() === 'f') toggleFullscreen()
      if (event.key === 'Escape') {
        setIsTheaterMode(false)
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  const resolution = useMemo(() => resolvePlaybackSources({
    mediaType,
    mediaId,
    season,
    episode,
    preferredProviderId: selectedProvider,
    nativeSources,
  }), [mediaId, mediaType, season, episode, selectedProvider, nativeSources])
  const allSources = resolution.sources
  const activeSource = allSources.find((source) => source.providerId === selectedProvider) ?? allSources[0]
  const activeSrc = activeSource?.mode === 'external-embed' ? activeSource.url : null

  useEffect(() => {
    reportPlayerEvent('player_source_resolution', {
      providerId: activeSource?.providerId ?? 'none',
      mediaType,
      resolutionStatus: resolution.status,
    })
  }, [activeSource?.providerId, mediaType, resolution.status])

  const persistPlaybackContext = (patch: Partial<{
    providerId: string
    playbackMode: 'external-embed' | 'native-media'
    positionSeconds: number
    durationSeconds: number
    verificationState: 'not-started' | 'frame-load-only' | 'native-playback-verified'
  }>) => {
    const itemId = Number(mediaId)
    if (!Number.isSafeInteger(itemId)) return
    const current = store.getContinueWatching().find((item) => item.id === itemId && item.media_type === mediaType)
    if (current) store.updateContinueWatching({ ...current, ...patch, lastOpenedAt: Date.now() })
  }

  useEffect(() => {
    if (!activeSource) return
    persistPlaybackContext({
      providerId: activeSource.providerId,
      playbackMode: activeSource.mode,
      verificationState: activeSource.mode === 'native-media' ? 'not-started' : 'frame-load-only',
    })
  // The current source is the complete playback context for this mounted route.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSource?.id, mediaId, mediaType])
  useEffect(() => {
    if (allSources.length === 0) {
      clearTimers()
      attemptStateRef.current = exhaustAttempts(attemptStateRef.current)
      setErrorCode(resolution.reason === 'unsupported' ? 'UNSUPPORTED_MEDIA_TYPE' : 'STREAM_UNAVAILABLE')
      setState('error')
      return
    }
    if (!allSources.some((source) => source.providerId === selectedProvider)) {
      setSelectedProvider(allSources[0].providerId)
    }
  }, [allSources, resolution.reason, selectedProvider])

  const clearTimers = () => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (hardTimerRef.current) clearTimeout(hardTimerRef.current)
  }

  // Warm only the selected provider after playback is requested.
  useEffect(() => {
    if (activeSource?.mode === 'external-embed') warmPlayerConnection(selectedProvider)
  }, [activeSource?.mode, selectedProvider])

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
    if (state !== 'loading' || !activeSource || activeSource.mode !== 'external-embed') return
    const attemptProviderId = activeSource.providerId
    attemptStateRef.current = beginAttempt(attemptStateRef.current, attemptProviderId)
    const attemptId = attemptStateRef.current.attemptId
    attemptIdRef.current = attemptId
    setFrameAttemptId(attemptId)
    if (!attemptedProviderIdsRef.current.includes(attemptProviderId)) {
      attemptedProviderIdsRef.current = [...attemptedProviderIdsRef.current, attemptProviderId]
    }
    recordProviderAttempt(attemptProviderId)
    reportPlayerEvent('player_attempt', { providerId: attemptProviderId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
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
      recordProviderFailure(attemptProviderId, 'timeout')
      reportPlayerEvent('player_timeout', { providerId: attemptProviderId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'startup-timeout', networkHint: networkHint() })
      setErrorCode('PLAYER_TIMEOUT')
      failoverToNextProvider()
    }, hardDeadline)

    return clearTimers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSource, retryCount, selectedProvider])

  const handleLoad = (providerId: string, attemptId: number) => {
    if (!isCurrentAttempt(attemptStateRef.current, attemptId, providerId)) return
    clearTimers()
    attemptStateRef.current = transitionAttempt(attemptStateRef.current, attemptId, 'frame-loaded')
    // An iframe load proves only that the document loaded. Opaque providers do
    // not expose a verified ready/playing signal to VEYRA.
    setState('frame-loaded')
    reportPlayerEvent('player_frame_loaded', { providerId, mediaType, startupMs: Date.now() - startedAtRef.current, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
    if (process.env.NODE_ENV === 'development') {
      console.debug('[veyra] player ready', {
        startupMs: Date.now() - startedAtRef.current,
        provider: selectedProvider,
        signal: 'FRAME_DOCUMENT_LOADED',
        networkHint: networkHint(),
        retryCount,
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
    reportPlayerEvent('player_retry', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: errorCode === 'PLAYER_TIMEOUT' ? 'timeout' : 'retry' })
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
    persistPlaybackContext({ providerId, playbackMode: activeSource?.mode ?? 'external-embed', verificationState: 'not-started' })
    reportPlayerEvent('player_manual_switch', { providerId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
    startedAtRef.current = Date.now()
  }

  const failoverToNextProvider = () => {
    const nextProvider = rankProviders({
      mediaType,
      attemptedProviderIds: attemptedProviderIdsRef.current,
      health: readProviderHealth(),
      preferredProviderId: getInitialProviderId(store.getSettings().defaultServer),
    })[0]
    if (!nextProvider) {
      clearTimers()
      attemptStateRef.current = exhaustAttempts(attemptStateRef.current)
      setState('timeout')
      setErrorCode('STREAM_UNAVAILABLE')
      reportPlayerEvent('player_source_exhausted', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'all-providers-failed' })
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
  const activeProviderObj = PROVIDERS.find((p) => p.id === selectedProvider) ?? null
  const candidateProviders = allSources
    .map((source) => PROVIDERS.find((provider) => provider.id === source.providerId))
    .filter((provider): provider is typeof PROVIDERS[number] => Boolean(provider))

  return (
    <>
      {isCinemaMode && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 bg-black/70 transition-opacity motion-reduce:transition-none" />
      )}
      <div className={isTheaterMode ? 'fixed inset-0 z-40 flex min-h-0 flex-col gap-3 bg-[#050507] p-3 sm:p-6' : `space-y-3 ${isCinemaMode ? 'relative z-40' : ''}`}>
      {/* Top Stream Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/8 bg-[#0A0D14]/90 p-2 px-3 text-xs backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          {candidateProviders.length > 0 ? (
            <>
              <span className="flex items-center gap-1.5 font-semibold text-white/80">
                <Server size={13} className="text-primary" />
                <span>Server:</span>
              </span>
              <div role="group" aria-label="Authorized playback servers" className="flex flex-wrap items-center gap-1.5">
                {candidateProviders.map((p) => {
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
                      <span className={`rounded px-1 py-0.2 text-[9px] uppercase font-bold tracking-tight ${isActive ? 'bg-black/20 text-white' : 'bg-white/10 text-white/50'}`}>
                        Authorized
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <span role="status" className="flex items-center gap-1.5 text-[11px] text-amber-200/80">
              <Server size={13} aria-hidden="true" />
              Authorized playback source unavailable
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline text-[11px] text-white/45"
            title="Resolution is controlled by the selected provider"
          >
            {activeSource?.mode === 'native-media' ? 'Quality: Native controls' : 'Quality: Not available'}
          </span>
          <span
            role="status"
            aria-live="polite"
            className="text-[10px] text-white/45 sm:text-[11px]"
            title={activeSource?.mode === 'native-media'
              ? 'VEYRA receives native media events'
              : activeSource
                ? 'VEYRA can verify only that the provider frame loaded'
                : 'No authorized playback source is configured'}
          >
            {activeSource?.mode === 'native-media'
              ? 'Playback: Native events'
              : activeSource
                ? state === 'frame-loaded'
                  ? 'Playback: Frame loaded; not independently verified'
                  : 'Playback: Provider controlled'
                : 'Playback: No authorized source'}
          </span>
          <button
            type="button"
            aria-label={isCinemaMode ? 'Turn lights on' : 'Turn lights off'}
            aria-pressed={isCinemaMode}
            onClick={() => setIsCinemaMode((prev) => {
              const next = !prev
              store.updateSettings({ ambientLighting: next })
              return next
            })}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${
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
            aria-label={isTheaterMode ? 'Exit theater mode' : 'Enter theater mode'}
            aria-pressed={isTheaterMode}
            onClick={() => setIsTheaterMode((current) => !current)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${
              isTheaterMode ? 'bg-primary/20 text-primary font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle theater mode (T)"
          >
            <RectangleHorizontal size={12} />
            <span>Theater</span>
          </button>
          <button
            type="button"
            aria-label={isFullscreen ? 'Exit full screen player' : 'Enter full screen player'}
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            title="Full screen player"
          >
            <Maximize2 size={12} />
            <span className="hidden sm:inline">{isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Frame */}
      <div
        ref={containerRef}
        className={`${isTheaterMode ? 'min-h-0 flex-1 aspect-auto' : 'aspect-video'} relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl transition-all ${
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
                {state === 'offline'
                  ? "You're offline"
                  : resolution.reason === 'unsupported'
                    ? 'Playback unavailable for this media type'
                    : 'Authorized playback source unavailable'}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {state === 'offline'
                  ? playerErrorMessage(errorCode)
                  : resolution.reason === 'unsupported'
                    ? 'This media type is not supported by the configured playback adapters.'
                    : 'No authorized HLS or MP4 source is configured for this title. Unverified third-party embeds are not enabled.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                {candidateProviders.length > 1 && (
                  <button
                    type="button"
                    onClick={failoverToNextProvider}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <Server size={13} aria-hidden="true" />
                    Try Next Server
                  </button>
                )}
                <button
                  type="button"
                  onClick={retry}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/40 transition-colors"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  Retry ({Math.max(0, MAX_RETRIES - retryCount)} left)
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
              {<div
                aria-hidden="true"
                className="mx-auto mb-4 size-10 animate-spin rounded-full border-2 border-white/10 border-t-[#E50914] motion-reduce:animate-none"
              />}
              <p className="text-sm font-semibold text-white font-display">
                {state === 'timeout-warning'
                  ? 'Connecting to stream…'
                  : `Connecting to ${activeProviderObj?.name ?? 'provider'}…`}
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

        {activeSource?.mode === 'native-media' && !isError && (
          <NativeMediaPlayer
            source={activeSource}
            title={title}
            onReady={() => {
              clearTimers()
              setState('frame-loaded')
            }}
            onStarted={() => {
              persistPlaybackContext({ verificationState: 'native-playback-verified' })
              reportPlayerEvent('player_native_playback_started', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length })
            }}
            onEnded={() => reportPlayerEvent('player_playback_ended', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length })}
            onError={() => {
              setErrorCode('PROVIDER_LOAD_ERROR')
              setState('error')
              reportPlayerEvent('player_error', { providerId: activeSource.providerId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'network-failure', networkHint: networkHint() })
            }}
            onProgress={(positionSeconds, durationSeconds) => persistPlaybackContext({ positionSeconds, durationSeconds })}
          />
        )}

        {/* Opaque external provider frame */}
        {activeSource?.mode === 'external-embed' && !isError && activeSrc && (
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
    </>
  )
}
