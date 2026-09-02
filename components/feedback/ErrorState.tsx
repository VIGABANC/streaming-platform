import Link from 'next/link'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  text?: string
  resetHref?: string
  onReset?: () => void
}

export function ErrorState({
  title = 'Something went wrong',
  text = 'We couldn\'t load this content. Please try again.',
  resetHref,
  onReset,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="grid min-h-64 place-items-center rounded-2xl border border-white/8 bg-white/[.02] p-8 text-center"
    >
      <div>
        <AlertCircle className="mx-auto mb-4 text-primary" size={30} aria-hidden="true" />
        <h2 className="text-xl font-bold text-white font-display">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </button>
          )}
          {resetHref && (
            <Link
              href={resetHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:border-primary hover:text-primary transition-colors"
            >
              <Home size={14} aria-hidden="true" />
              Go home
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
