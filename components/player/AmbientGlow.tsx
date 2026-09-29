'use client'

import { useEffect, useRef, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// AmbientGlow — blurred, saturated backlight behind the video container.
//
// For native sources: samples a low-res grid of the video frame every 500ms
// via <canvas>, producing a soft radial gradient.
// For iframe embeds (cross-origin): falls back to a static gradient derived
// from the poster art's dominant colors.
//
// Respects prefers-reduced-motion (disables dynamic sampling) and
// prefers-reduced-transparency (reduces glow opacity to 0.1).
// ─────────────────────────────────────────────────────────────────────────────

interface AmbientGlowProps {
  /** The <video> element to sample frames from (native sources only). */
  videoRef: React.RefObject<HTMLVideoElement | null>
  /** Whether the source is native media (canvas sampling) or iframe (static). */
  isNative: boolean
  /** Poster/backdrop URL for static gradient derivation. */
  posterUrl?: string
  /** 'off' | 'on' | 'auto' — auto defers to prefers-reduced-motion. */
  mode: 'off' | 'on' | 'auto'
}

interface DominantColor {
  r: number
  g: number
  b: number
}

function rgba(c: DominantColor, alpha: number): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`
}

function defaultGradient(): string {
  return 'radial-gradient(circle at 50% 50%, rgba(20,20,30,0.35), rgba(10,10,10,0.1))'
}

export function AmbientGlow({ videoRef, isNative, posterUrl, mode }: AmbientGlowProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gradient, setGradient] = useState<string>(defaultGradient())
  const [reducedMotion, setReducedMotion] = useState(false)
  const [reducedTransparency, setReducedTransparency] = useState(false)

  // Determine effective mode: 'auto' defers to prefers-reduced-motion
  const effectiveOff = mode === 'off' || (mode === 'auto' && reducedMotion)

  // Media queries for reduced motion / transparency
  useEffect(() => {
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mqTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)')
    const update = () => {
      setReducedMotion(mqMotion.matches)
      setReducedTransparency(mqTransparency.matches)
    }
    update()
    mqMotion.addEventListener?.('change', update)
    mqTransparency.addEventListener?.('change', update)
    return () => {
      mqMotion.removeEventListener?.('change', update)
      mqTransparency.removeEventListener?.('change', update)
    }
  }, [])

  // Static gradient from poster art dominant colors (iframe / reduced-motion)
  useEffect(() => {
    if (effectiveOff || !posterUrl) return
    // For iframe embeds or reduced-motion, derive a static gradient from the poster.
    // We use a simple approach: load the image, draw to a tiny canvas, sample pixels.
    if (isNative && !reducedMotion) return // Native + no reduced motion → dynamic sampling

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 8
      canvas.height = 8
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 8, 8)
      try {
        const data = ctx.getImageData(0, 0, 8, 8).data
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
        const avg: DominantColor = {
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        }
        setGradient(`radial-gradient(circle at 50% 50%, ${rgba(avg, 0.35)}, ${rgba(avg, 0.05)})`)
      } catch {
        // Cross-origin taint — keep default gradient
      }
    }
    img.onerror = () => {}
    img.src = posterUrl
  }, [posterUrl, isNative, reducedMotion, effectiveOff])

  // Dynamic frame sampling for native sources
  useEffect(() => {
    if (effectiveOff || !isNative || reducedMotion) return

    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let active = true
    const sample = () => {
      if (!active || !canvas || !video || video.readyState < 2) return
      canvas.width = 8
      canvas.height = 8
      try {
        ctx.drawImage(video, 0, 0, 8, 8)
        const data = ctx.getImageData(0, 0, 8, 8).data
        let r = 0, g = 0, b = 0, count = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
          count++
        }
        const avg: DominantColor = {
          r: Math.round(r / count),
          g: Math.round(g / count),
          b: Math.round(b / count),
        }
        setGradient(`radial-gradient(circle at 50% 50%, ${rgba(avg, 0.35)}, ${rgba(avg, 0.05)})`)
      } catch {
        // Cross-origin taint — fall back to default
      }
    }

    const interval = setInterval(sample, 500)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [isNative, reducedMotion, effectiveOff, videoRef])

  if (effectiveOff) return null

  const opacity = reducedTransparency ? 0.1 : 0.35

  return (
    <>
      {/* Hidden sampling canvas for native sources */}
      {isNative && !reducedMotion && (
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      )}
      {/* Ambient glow layer — positioned behind the video container */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: gradient,
          filter: 'blur(60px) saturate(1.6)',
          opacity,
          transition: reducedMotion ? 'none' : 'opacity 0.5s ease',
        }}
      />
    </>
  )
}
