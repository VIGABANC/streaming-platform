import { WifiOff, RotateCcw } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'

export default function OfflinePage() {
  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-white/10 bg-surface/60 text-muted-foreground shadow-xl">
          <WifiOff size={28} />
        </div>

        <p className="eyebrow">Connection Lost</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white font-display md:text-5xl">
          You are offline
        </h1>

        <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
          VEYRA requires an active internet connection to stream movies and discover new titles.
        </p>

        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <RotateCcw size={14} />
            <span>Reconnect</span>
          </a>
        </div>
      </div>
    </Shell>
  )
}
