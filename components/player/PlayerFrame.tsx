'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Play,
  Pause,
  RefreshCw,
  Globe,
  ChevronRight,
  HelpCircle,
  X,
} from 'lucide-react'
import {
  warmPlayerConnection,
  PROVIDERS,
  CONSUMET_PROVIDER,
  getInitialProviderId,
  getInitialProviderIdForMode,
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
import { getEmbedProviderConfig } from '@/lib/providers/embed-registry'
import { playbackErrorCopyForPlayer } from '@/lib/providers/errors'
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

export interface ProviderHealthInfo {
  id: string
  name: string
  origin: string
  dnsResolved: boolean
  reachable: boolean
  status: 'healthy' | 'degraded' | 'dns-failure' | 'unreachable' | 'timeout' | 'rate-limited' | 'unverified'
  latencyMs: number | null
  lastCheckedAt: string
  error: string | null
}

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
  providerHealth?: ProviderHealthInfo[]
  nextEpisodeHref?: string
  prevEpisodeHref?: string
  preferredProviderId?: string
}

type PlayerState = 'loading' | 'frame-loaded' | 'timeout-warning' | 'timeout' | 'error' | 'offline'
type PlaybackState = 'playing' | 'paused' | 'buffering' | 'ended' | 'error'

const TIMEOUT_WARNING_MS = 8_000
const MAX_RETRIES = 3
const EMPTY_SOURCES: PlaybackSource[] = []
const THEATER_MODE_KEY = 'veyra-player-theater'
const HEALTH_REFRESH_DEBOUNCE_MS = 5_000
const NEXT_EPISODE_COUNTDOWN_S = 10

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
  providerHealth = [],
  nextEpisodeHref,
  prevEpisodeHref,
  preferredProviderId,
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
  const [playbackState, setPlaybackState] = useState<PlaybackState>('paused')
  const [showCenterIcon, setShowCenterIcon] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [healthState, setHealthState] = useState(providerHealth)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [nextCountdown, setNextCountdown] = useState<number | null>(null)
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null)
  const [retryAllAt, setRetryAllAt] = useState(0)
  const showShortcutsRef = useRef(false)
  const shortcutsTriggerRef = useRef<HTMLButtonElement>(null)
  const shortcutsDialogRef = useRef<HTMLDivElement>(null)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const lastHealthRefreshRef = useRef(0)
  const router = useRouter()
  const startedAtRef = useRef(Date.now())
  const attemptIdRef = useRef(0)
  const attemptStateRef = useRef(initialAttemptState)
  const attemptedProviderIdsRef = useRef<string[]>([])
  const automaticFallbacksRef = useRef(0)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const centerIconTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settings = store.getSettings()

  // Server-rendered health data is the initial snapshot; "Retry health"
  // replaces it with a fresh probe response.
  useEffect(() => {
    setHealthState(providerHealth)
  }, [providerHealth])

  useEffect(() => {
    showShortcutsRef.current = showShortcuts
  }, [showShortcuts])

  // Shortcuts dialog: focus trap while open, focus restored on close, and
  // any pointer press outside it (and its trigger) closes it.
  useEffect(() => {
    if (!showShortcuts) return
    const trigger = shortcutsTriggerRef.current
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!shortcutsDialogRef.current?.contains(target) && !trigger?.contains(target)) {
        setShowShortcuts(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    shortcutsDialogRef.current?.focus()
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      trigger?.focus()
    }
  }, [showShortcuts])

  // Build a health lookup map from the current health snapshot
  const healthMap = useMemo(() => {
    const map = new Map<string, ProviderHealthInfo>()
    for (const h of healthState) map.set(h.id, h)
    return map
  }, [healthState])

  // Providers that are usable (DNS resolved)
  const usableProviderIds = useMemo(() => {
    if (healthState.length === 0) return new Set(PROVIDERS.map((p) => p.id))
    return new Set(healthState.filter((h) => h.dnsResolved).map((h) => h.id))
  }, [healthState])

  // DNS-failed providers
  const dnsFailedProviderIds = useMemo(() => {
    if (healthState.length === 0) return new Set<string>()
    return new Set(healthState.filter((h) => !h.dnsResolved).map((h) => h.id))
  }, [healthState])

  // Whether the selected provider has a DNS failure
  const selectedProviderDnsFailed = dnsFailedProviderIds.has(selectedProvider)
  const noHealthyProviders = healthState.length > 0 && usableProviderIds.size === 0

  useEffect(() => {
    const settings = store.getSettings()
    // Auto-select the first healthy provider if health data is available
    if (preferredProviderId && !healthState.some((h) => h.id === preferredProviderId && !h.dnsResolved)) {
      setSelectedProvider(preferredProviderId)
    } else if (healthState.length > 0) {
      const firstHealthy = healthState.find((h) => h.dnsResolved && (h.status === 'healthy' || h.status === 'degraded'))
      if (firstHealthy) {
        setSelectedProvider(firstHealthy.id)
      } else {
        // Fall back to first DNS-resolved provider
        const firstResolved = healthState.find((h) => h.dnsResolved)
        if (firstResolved) setSelectedProvider(firstResolved.id)
      }
    } else {
      const initialProviderId = getInitialProviderIdForMode(settings, { health: readProviderHealth(), mediaType })
      setSelectedProvider(initialProviderId)
    }
    setIsCinemaMode(settings.ambientLighting)
    // Restore persisted theater mode preference
    if (window.localStorage.getItem(THEATER_MODE_KEY) === '1') setIsTheaterMode(true)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(settings.reducedMotion || mediaQuery.matches)
    updateMotion()
    mediaQuery.addEventListener?.('change', updateMotion)
    return () => mediaQuery.removeEventListener?.('change', updateMotion)
  }, [mediaType]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, button, [contenteditable="true"]')) return
      if (event.key === ' ' || event.key.toLowerCase() === 'k') {
        event.preventDefault()
        togglePlayback()
        showControlsTemporarily()
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const video = videoElementRef.current
        if (video && Number.isFinite(video.duration)) {
          event.preventDefault()
          video.currentTime = Math.min(video.duration, Math.max(0, video.currentTime + (event.key === 'ArrowRight' ? 10 : -10)))
        }
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const video = videoElementRef.current
        if (video) {
          event.preventDefault()
          video.volume = Math.min(1, Math.max(0, video.volume + (event.key === 'ArrowUp' ? 0.05 : -0.05)))
          video.muted = false
        }
      }
      if (event.key.toLowerCase() === 't') toggleTheaterMode()
      if (event.key.toLowerCase() === 'l') setIsCinemaMode((current) => {
        const next = !current
        store.updateSettings({ ambientLighting: next })
        return next
      })
      if (event.key.toLowerCase() === 'f') toggleFullscreen()
      if (event.key.toLowerCase() === 'm') {
        const video = videoElementRef.current
        if (video) video.muted = !video.muted
      }
      if (event.key.toLowerCase() === 'c') {
        const video = videoElementRef.current
        if (video && video.textTracks.length > 0) {
          const next = video.textTracks[0].mode !== 'showing'
          for (let i = 0; i < video.textTracks.length; i++) video.textTracks[i].mode = i === 0 && next ? 'showing' : 'disabled'
          window.localStorage.setItem('veyra-player-captions', next ? '1' : '0')
        }
      }
      if (event.key === 'Escape') {
        // The shortcuts tooltip closes before Esc exits fullscreen/theater.
        if (showShortcutsRef.current) {
          setShowShortcuts(false)
          return
        }
        setIsTheaterMode(false)
        window.localStorage.setItem(THEATER_MODE_KEY, '0')
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    subtitleLanguage: settings.subtitleLanguage,
    preferredProviderId: preferredProviderId ?? selectedProvider,
    nativeSources,
  }), [mediaId, mediaType, season, episode, selectedProvider, preferredProviderId, nativeSources, settings.subtitleLanguage])
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
      verificationState: 'not-started',
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
  }, [allSources, resolution.reason, selectedProvider, retryCount])

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
    persistPlaybackContext({ verificationState: 'frame-load-only' })
    reportPlayerEvent('player_frame_loaded', { providerId, mediaType, startupMs: Date.now() - startedAtRef.current, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
    void fetch('/api/player/preference', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ providerId }) }).catch(() => {})
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
    if (automaticFallbacksRef.current > 0) {
      const providerName = uiRegistry.find((provider) => provider.id === providerId)?.name ?? 'another server'
      setFallbackNotice(`Switched to ${providerName}`)
      window.setTimeout(() => setFallbackNotice(null), 4_000)

      reportPlayerEvent('player_auto_failover', { providerId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'provider-failed', networkHint: networkHint() })
    }
    setRetryCount(0)
    setState('loading')
    persistPlaybackContext({ providerId, playbackMode: activeSource?.mode ?? 'external-embed', verificationState: 'not-started' })
    reportPlayerEvent('player_manual_switch', { providerId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, networkHint: networkHint() })
    startedAtRef.current = Date.now()
  }

  const failoverToNextProvider = () => {
    if (automaticFallbacksRef.current >= 2) {
      clearTimers()
      attemptStateRef.current = exhaustAttempts(attemptStateRef.current)
      setState('timeout')
      setErrorCode('STREAM_UNAVAILABLE')
      return
    }
    automaticFallbacksRef.current += 1
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

  const flashCenterIcon = (icon: 'play' | 'pause' | 'replay' | 'error') => {
    setPlaybackState(icon === 'play' ? 'playing' : icon === 'pause' ? 'paused' : icon === 'replay' ? 'ended' : 'error')
    setShowCenterIcon(true)
    if (centerIconTimerRef.current) clearTimeout(centerIconTimerRef.current)
    centerIconTimerRef.current = setTimeout(() => setShowCenterIcon(false), 800)
  }

  const togglePlayback = () => {
    // Native playback is controlled directly; opaque external embeds only
    // get a visual flash because the provider owns its own controls.
    const video = videoElementRef.current
    if (video) {
      if (video.paused) video.play().catch(() => {})
      else video.pause()
      return
    }
    setPlaybackState((prev) => {
      const next = prev === 'playing' ? 'paused' : 'playing'
      flashCenterIcon(next === 'playing' ? 'play' : 'pause')
      return next
    })
  }

  const showControlsTemporarily = () => {
    setControlsVisible(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    if (playbackState === 'playing') {
      controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 2_000)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode((current) => {
      const next = !current
      window.localStorage.setItem(THEATER_MODE_KEY, next ? '1' : '0')
      return next
    })
  }, [])

  const registerVideo = useCallback((element: HTMLVideoElement | null) => {
    videoElementRef.current = element
  }, [])

  const refreshHealth = () => {
    // Debounced: rapid clicks must not hammer providers (5s minimum).
    const now = Date.now()
    if (now - lastHealthRefreshRef.current < HEALTH_REFRESH_DEBOUNCE_MS) return
    lastHealthRefreshRef.current = now
    fetch('/api/health/providers?refresh=1')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('health check failed'))))
      .then((body: { providers?: ProviderHealthInfo[] }) => {
        if (Array.isArray(body.providers)) setHealthState(body.providers)
      })
      .catch(() => {})
  }

  // ── Next episode countdown ────────────────────────────────────────────────
  const nextEpisodeCancelKey = `veyra-next-cancelled:${mediaType}:${mediaId}:${season ?? ''}:${episode ?? ''}`

  const startNextEpisodeCountdown = () => {
    if (!nextEpisodeHref) return
    try {
      if (window.sessionStorage.getItem(nextEpisodeCancelKey) === '1') return
    } catch { /* sessionStorage unavailable — still show the countdown */ }
    setNextCountdown(NEXT_EPISODE_COUNTDOWN_S)
  }

  const cancelNextEpisode = () => {
    try {
      window.sessionStorage.setItem(nextEpisodeCancelKey, '1')
    } catch { /* best effort */ }
    setNextCountdown(null)
  }

  useEffect(() => {
    if (nextCountdown == null) return
    if (nextCountdown <= 0) {
      router.push(nextEpisodeHref as string)
      setNextCountdown(null)
      return
    }
    // The countdown pauses while the tab is backgrounded.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setNextCountdown((count) => (count == null ? null : count - 1))
      }
    }, 1_000)
    return () => clearInterval(timer)
  }, [nextCountdown, nextEpisodeHref, router])

  const isError = state === 'error' || state === 'timeout' || state === 'offline'
  const isDnsError = selectedProviderDnsFailed || noHealthyProviders
  // The anime-only Consumet entry joins the UI registry so native anime sources
  // resolve a server entry; movie/TV resolution still uses PROVIDERS alone.
  const uiRegistry = useMemo(() => [...PROVIDERS, CONSUMET_PROVIDER], [])
  const activeProviderObj = uiRegistry.find((p) => p.id === selectedProvider) ?? null
  const candidateProviders = allSources
    .map((source) => uiRegistry.find((provider) => provider.id === source.providerId))
    .filter((provider): provider is typeof PROVIDERS[number] => Boolean(provider))

  const healthDotClass = (providerId: string): { dot: string; label: string } => {
    const h = healthMap.get(providerId)
    if (!h) return { dot: 'bg-white/40', label: 'Unknown' }
    switch (h.status) {
      case 'healthy': return { dot: 'bg-green-500', label: 'Healthy' }
      case 'degraded': return { dot: 'bg-yellow-500', label: 'Slow' }
      case 'dns-failure': return { dot: 'bg-red-500', label: 'DNS failure' }
      case 'unreachable':
      case 'timeout': return { dot: 'bg-red-500', label: 'Unreachable' }
      case 'rate-limited': return { dot: 'bg-yellow-500', label: 'Rate limited' }
      default: return { dot: 'bg-white/40', label: 'Unverified' }
    }
  }

  return (
    <>
      {isCinemaMode && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 bg-black/70 transition-opacity motion-reduce:transition-none" />
      )}
      <div className={isTheaterMode ? 'fixed inset-0 z-40 flex min-h-0 flex-col gap-3 bg-[#050507] p-3 sm:p-6' : `space-y-3 ${isCinemaMode ? 'relative z-40' : ''}`}>
      {fallbackNotice && (
        <div role="status" aria-live="polite" className="pointer-events-none fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full border border-primary/40 bg-[#151019]/95 px-4 py-2 text-xs font-semibold text-white shadow-2xl shadow-primary/20">
          {fallbackNotice}
        </div>
      )}
      {/* Top Stream Control Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-white/8 bg-[#0A0D14]/90 p-2 px-3 text-xs backdrop-blur-md transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 font-semibold text-white/80">
            <Server size={13} className="text-primary" />
            <span>Server:</span>
          </span>
          <div role="group" aria-label="Playback servers" className="flex flex-wrap items-center gap-1.5">
            {candidateProviders.map((p) => {
              const isActive = p.id === selectedProvider
              const dnsFailed = dnsFailedProviderIds.has(p.id)
              const health = healthDotClass(p.id)
              return (
                <span key={p.id} className="inline-flex items-center">
                <button
                  type="button"
                  aria-pressed={isActive}
                  disabled={dnsFailed}
                  aria-disabled={dnsFailed || undefined}
                  aria-describedby={dnsFailed ? `server-status-${p.id}` : undefined}
                  title={dnsFailed ? 'Domain not resolvable' : health.label}
                  onClick={() => !dnsFailed && switchProvider(p.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : dnsFailed
                        ? 'bg-white/5 text-white/30 cursor-not-allowed opacity-50'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {isActive && <Check size={11} />}
                  <span className={`size-1.5 rounded-full ${health.dot}`} aria-hidden="true" />
                  <span>{p.name.replace(/\(.*\)/, '').trim()}</span>
                </button>
                {dnsFailed && (
                  <span id={`server-status-${p.id}`} className="sr-only">
                    Domain not resolvable — this server is unavailable.
                  </span>
                )}
                </span>
              )
            })}
            <button
              type="button"
              onClick={refreshHealth}
              title="Retry health check"
              aria-label="Retry health check"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw size={11} />
            </button>
          </div>
          {candidateProviders.length === 0 && (
            <span role="status" className="text-[11px] text-amber-200/80">No verified provider is configured for this media type.</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline text-[11px] text-white/45"
            title={activeSource ? 'Resolution is controlled by the selected source' : 'No verified source is available'}
          >
            {!activeSource ? 'Quality: Unavailable' : activeSource.mode === 'native-media' ? 'Quality: Native controls' : 'Quality: Provider controlled'}
          </span>
          <span
            role="status"
            aria-live="polite"
            className="text-[10px] text-white/45 sm:text-[11px]"
            title={!activeSource ? 'No verified source is available' : activeSource.mode === 'native-media' ? 'VEYRA receives native media events' : 'A frame load does not verify playback'}
          >
            {!activeSource ? 'Playback: Unavailable' : activeSource.mode === 'native-media'
              ? 'Playback: Native events'
              : state === 'frame-loaded'
                ? 'Playback: Frame loaded; not independently verified'
                : 'Playback: Provider controlled'}
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
          <div className="relative">
            <button
              type="button"
              ref={shortcutsTriggerRef}
              aria-label="Keyboard shortcuts"
              aria-expanded={showShortcuts}
              aria-haspopup="dialog"
              onClick={() => setShowShortcuts((current) => !current)}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors ${
                showShortcuts ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle size={12} />
              <span className="hidden sm:inline">Shortcuts</span>
            </button>
            {showShortcuts && (
              <div
                ref={shortcutsDialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Keyboard shortcuts"
                tabIndex={-1}
                onKeyDown={(event) => {
                  // Focus trap: the dialog itself is the only tab stop.
                  if (event.key === 'Tab') event.preventDefault()
                }}
                className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-[#0A0D14] p-3 shadow-2xl outline-none backdrop-blur-md"
              >
                <ul className="space-y-1.5 text-[11px] text-white/80">
                  <li className="flex items-center justify-between gap-3"><span>Play / Pause</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">Space / K</kbd></li>
                  <li className="flex items-center justify-between gap-3"><span>Seek 10s</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">← / →</kbd></li>
                  <li className="flex items-center justify-between gap-3"><span>Volume</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">↑ / ↓</kbd></li>
                  <li className="flex items-center justify-between gap-3"><span>Fullscreen</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">F</kbd></li>
                  <li className="flex items-center justify-between gap-3"><span>Mute</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">M</kbd></li>
                  <li className="flex items-center justify-between gap-3"><span>Captions</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">C</kbd></li>
                  <li className="flex items-center justify-between gap-3"><span>Close / Exit</span><kbd className="rounded bg-white/10 px-1.5 py-0.5 font-semibold">Esc</kbd></li>
                </ul>
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label={isTheaterMode ? 'Exit theater mode' : 'Enter theater mode'}
            aria-pressed={isTheaterMode}
            onClick={toggleTheaterMode}
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
          {prevEpisodeHref && (
            <Link
              href={prevEpisodeHref}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              title="Previous episode"
            >
              <ArrowLeft size={12} />
            </Link>
          )}
          {nextEpisodeHref && (
            <Link
              href={nextEpisodeHref}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              title="Next episode"
            >
              <ChevronRight size={12} />
            </Link>
          )}
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
            <div role="alert" aria-live="assertive" className="relative z-10 max-w-md p-8 text-center">
              {state === 'offline' ? (
                <WifiOff size={36} className="mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <AlertCircle size={36} className="mx-auto mb-4 text-primary" aria-hidden="true" />
              )}
              <h2 className="text-lg font-bold text-white font-display">
                {state === 'offline' ? "You're offline" : resolution.reason === 'unsupported' ? 'Playback unavailable for this media type' : automaticFallbacksRef.current >= 2 ? 'Playback unavailable' : 'This server did not start'}
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {automaticFallbacksRef.current >= 2 && state !== 'offline'
                  ? playbackErrorCopyForPlayer('STREAM_UNAVAILABLE')
                  : playbackErrorCopyForPlayer(errorCode)}
              </p>
              {automaticFallbacksRef.current >= 2 && state !== 'offline' && (
                <div role="alert" aria-live="assertive" className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
                  <ul className="space-y-2 text-[11px] text-white/70" aria-label="Server results">
                    {candidateProviders.map((provider) => {
                      const failed = attemptedProviderIdsRef.current.includes(provider.id)
                      const dnsFailed = dnsFailedProviderIds.has(provider.id)
                      return <li key={provider.id} className="flex items-center justify-between gap-4"><span>{failed ? '×' : '·'} {provider.name}</span><span className={dnsFailed ? 'text-red-300' : failed ? 'text-amber-200' : 'text-white/45'}>{dnsFailed ? 'DNS failure' : failed ? 'did not respond' : 'not tried'}</span></li>
                    })}
                  </ul>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={retryAllAt > Date.now()}
                      onClick={() => {
                        if (retryAllAt > Date.now()) return
                        setRetryAllAt(Date.now() + 10_000)
                        reloadPlayer()
                      }}
                      className="rounded-full border border-primary/40 px-3 py-1.5 text-[11px] font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Retry all{retryAllAt > Date.now() ? ' (10s)' : ''}
                    </button>
                    <label className="sr-only" htmlFor="failed-server-switch">Switch server</label>
                    <select
                      id="failed-server-switch"
                      value={selectedProvider}
                      onChange={(event) => switchProvider(event.target.value)}
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] text-white"
                    >
                      {candidateProviders.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                    </select>
                  </div>
                </div>
              )}
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

        {/* DNS failure — do not render iframe */}
        {isDnsError && !isError && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/90 backdrop-blur-sm">
            {artwork && (
              <img
                src={artwork}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 blur-md"
              />
            )}
            <div className="relative z-10 max-w-md p-8 text-center">
              <Globe size={36} className="mx-auto mb-4 text-red-500" aria-hidden="true" />
              <h2 className="text-lg font-bold text-white font-display">
                Provider unavailable
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                This server&apos;s domain cannot be resolved. Try another server.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                {candidateProviders.filter((p) => !dnsFailedProviderIds.has(p.id)).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nextHealthy = candidateProviders.find((p) => !dnsFailedProviderIds.has(p.id))
                      if (nextHealthy) switchProvider(nextHealthy.id)
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                  >
                    <Server size={13} aria-hidden="true" />
                    Switch server
                  </button>
                )}
                <button
                  type="button"
                  onClick={refreshHealth}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-white/40 transition-colors"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  Retry health
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

        {/* Next episode countdown */}
        {nextCountdown != null && nextCountdown > 0 && nextEpisodeHref && (
          <div
            role="dialog"
            aria-label="Next episode countdown"
            className="absolute bottom-4 right-4 z-20 w-56 rounded-xl border border-white/10 bg-black/85 p-4 text-white backdrop-blur-md shadow-2xl"
          >
            <p className="text-xs font-semibold font-display">Next episode in {nextCountdown}s</p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                href={nextEpisodeHref}
                className="flex-1 rounded-full bg-primary px-3 py-1.5 text-center text-[11px] font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Play now
              </Link>
              <button
                type="button"
                onClick={cancelNextEpisode}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-white/80 hover:border-white/40 hover:text-white transition-colors"
              >
                <X size={11} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Center icon flash for keyboard / interaction feedback */}
        {showCenterIcon && !isError && !isDnsError && (
          <div className="pointer-events-none absolute inset-0 z-15 grid place-items-center">
            <div className="grid size-16 place-items-center rounded-full bg-black/50 backdrop-blur-sm">
              {playbackState === 'playing' && <Play size={28} fill="white" className="text-white" />}
              {playbackState === 'paused' && <Pause size={28} fill="white" className="text-white" />}
              {playbackState === 'ended' && <RotateCcw size={28} className="text-white" />}
              {playbackState === 'error' && <AlertCircle size={28} className="text-red-500" />}
            </div>
          </div>
        )}

        {/* Click overlay for play/pause toggle (only when not loading/error) */}
        {state === 'frame-loaded' && !isError && !isDnsError && (
          <div
            className="absolute inset-0 z-5"
            onClick={togglePlayback}
            onMouseMove={showControlsTemporarily}
            onDoubleClick={toggleFullscreen}
          />
        )}

        {activeSource?.mode === 'native-media' && !isError && !isDnsError && (
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
            registerVideo={registerVideo}
            onEnded={() => {
              reportPlayerEvent('player_playback_ended', { providerId: selectedProvider, mediaType, attemptIndex: attemptedProviderIdsRef.current.length })
              startNextEpisodeCountdown()
            }}
            onError={() => {
              setErrorCode('PROVIDER_LOAD_ERROR')
              setState('error')
              reportPlayerEvent('player_error', { providerId: activeSource.providerId, mediaType, attemptIndex: attemptedProviderIdsRef.current.length, errorCategory: 'network-failure', networkHint: networkHint() })
            }}
            onProgress={(positionSeconds, durationSeconds) => persistPlaybackContext({ positionSeconds, durationSeconds })}
          />
        )}

        {/* Opaque external provider frame */}
        {activeSource?.mode === 'external-embed' && !isError && !isDnsError && activeSrc && (
          <iframe
            key={`${selectedProvider}-${retryCount}`}
            title={title}
            src={activeSrc}
            allow={getEmbedProviderConfig(selectedProvider)?.allow ?? 'autoplay; fullscreen; encrypted-media; picture-in-picture'}
            allowFullScreen
            referrerPolicy={getEmbedProviderConfig(selectedProvider)?.referrerPolicy ?? 'origin'}
            className={`h-full w-full ${reducedMotion ? 'opacity-100' : 'transition-opacity duration-500'} ${
              reducedMotion || state === 'frame-loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => handleLoad(selectedProvider, frameAttemptId)}
            onError={() => handleError(selectedProvider, frameAttemptId)}
            sandbox={getEmbedProviderConfig(selectedProvider)?.sandbox ?? 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-popups-to-escape-sandbox allow-orientation-lock'}
          />
        )}
      </div>
      </div>
    </>
  )
}
