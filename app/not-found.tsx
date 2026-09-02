import Link from 'next/link'
import { Film, Home, Search } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'

export default function NotFoundPage() {
  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-white/10 bg-surface/60 text-primary shadow-xl">
          <Film size={28} />
        </div>

        <p className="eyebrow">404 — Frequency Lost</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white font-display md:text-5xl">
          Page Not Found
        </h1>

        <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
          The signal you followed doesn&apos;t exist or has moved to a different frequency.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <Home size={14} />
            <span>Go to Home</span>
          </Link>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface px-6 py-2.5 text-xs font-semibold text-white hover:border-primary transition-colors"
          >
            <Search size={14} />
            <span>Search Catalog</span>
          </Link>
        </div>
      </div>
    </Shell>
  )
}
