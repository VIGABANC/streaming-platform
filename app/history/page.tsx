'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { History, Play, Trash2, Clock } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { store, subscribeToStorageChanges, type HistoryItem, showToast } from '@/lib/store'
import { backdrop } from '@/lib/tmdb'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [mounted, setMounted] = useState(false)

  const reload = () => {
    setHistory(store.getHistory())
  }

  useEffect(() => {
    setMounted(true)
    reload()
    return subscribeToStorageChanges('veyra-history', reload)
  }, [])

  const handleRemove = (id: number, mediaType: HistoryItem['media_type'], title: string) => {
    store.removeFromHistory(id, mediaType)
    reload()
    showToast({
      title: 'Removed from history',
      description: title,
      type: 'info',
    })
  }

  const handleClear = () => {
    if (history.length === 0) return
    const prev = [...history]
    store.clearHistory()
    reload()
    showToast({
      title: 'Watch history cleared',
      type: 'info',
      action: {
        label: 'Undo',
        onClick: () => {
          prev.forEach((item) => store.addToHistory(item))
          reload()
        },
      },
    })
  }

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan mb-2">
              <History size={18} />
              <p className="eyebrow text-cyan">Activity Log</p>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Watch History
            </h1>
            <p className="mt-1 text-xs text-white/60">
              {mounted ? `${history.length} titles streamed on this device` : 'Loading history…'}
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-400 transition-colors self-start sm:self-auto"
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {mounted && history.length === 0 && (
          <div className="flex min-h-[45vh] flex-col items-center justify-center text-center p-8">
            <div className="grid size-16 place-items-center rounded-2xl bg-cyan/10 border border-cyan/30 text-cyan mb-4 shadow-xl">
              <History size={30} />
            </div>
            <h2 className="font-display text-2xl font-bold text-white">No stream history yet</h2>
            <p className="mt-2 text-xs text-white/60 max-w-sm">
              Titles you start watching will appear here with instant resume shortcuts and progress tracking.
            </p>
            <Link
              href="/movies"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105"
            >
              <Play size={14} fill="currentColor" />
              <span>Start Watching</span>
            </Link>
          </div>
        )}

        {/* History List */}
        {mounted && history.length > 0 && (
          <div className="mt-8 space-y-3">
            {history.map((item) => {
              const watchHref = item.media_type === 'tv'
                ? `/watch/tv/${item.id}/${item.season || 1}/${item.episode || 1}`
                : `/watch/movie/${item.id}`
              const detailHref = `/${item.media_type}/${item.id}`
              const dateStr = new Date(item.watchedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={`${item.media_type}-${item.id}-${item.season}-${item.episode}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/8 bg-[#0A0D14] p-3.5 sm:p-4 hover:border-white/20 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-24 sm:w-32 shrink-0 overflow-hidden rounded-xl bg-black/50">
                      <Image
                        src={backdrop(item.backdrop_path || item.poster_path, 'w300')}
                        alt={item.title}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                      <Link
                        href={watchHref}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center"
                      >
                        <div className="grid size-8 place-items-center rounded-full bg-primary text-white shadow">
                          <Play size={12} fill="white" className="ml-0.5" />
                        </div>
                      </Link>
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                          {item.media_type === 'tv' ? 'Series' : 'Film'}
                        </span>
                        {item.season && item.episode ? (
                          <span className="text-xs font-mono font-bold text-cyan">
                            S{item.season} E{item.episode}
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={detailHref}
                        className="mt-1 block font-display text-sm sm:text-base font-bold text-white hover:text-primary transition-colors truncate"
                      >
                        {item.title}
                      </Link>

                      {item.episodeTitle && (
                        <p className="text-xs text-white/60 truncate">{item.episodeTitle}</p>
                      )}

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-white/40">
                        <Clock size={11} />
                        <span>Watched {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <Link
                      href={watchHref}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow hover:bg-primary/90 transition-all hover:scale-105"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Resume</span>
                    </Link>

                    <button
                      type="button"
                      aria-label={`Remove ${item.title} from history`}
                      onClick={() => handleRemove(item.id, item.media_type, item.title)}
                      className="grid size-9 place-items-center rounded-full border border-white/10 text-white/50 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Shell>
  )
}
