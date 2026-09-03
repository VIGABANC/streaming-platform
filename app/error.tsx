'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw, Home } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[VEYRA] Caught error in error boundary:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050507] p-6 text-center text-white">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="max-w-md rounded-2xl border border-white/10 bg-surface/80 p-8 shadow-2xl backdrop-blur-md">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-rose-500/10 text-rose-400">
          <AlertCircle size={24} />
        </div>

        <h1 className="text-xl font-bold font-display text-white">
          Signal Interrupted
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          We encountered an unexpected error while rendering this page.
        </p>

        {error.message && (
          <div className="mt-4 rounded-lg bg-black/40 p-3 text-left font-mono text-[11px] text-white/70 overflow-x-auto">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:border-primary hover:text-primary transition-colors"
          >
            <Home size={14} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
