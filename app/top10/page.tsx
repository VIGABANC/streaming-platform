import type { Metadata } from 'next'
import { Film, Tv, Flame } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { RankedCard } from '@/components/media/RankedCard'
import { getTopTenMovies, getTopTenTV } from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'Top 10 Most Watched Today — VEYRA',
  description: 'Explore the daily top 10 movies and TV shows streaming on VEYRA right now.',
}

export default async function TopTenPage() {
  const [movies, tv] = await Promise.all([
    getTopTenMovies().catch(() => []),
    getTopTenTV().catch(() => []),
  ])

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-12 space-y-12">
        {/* Header */}
        <section className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Flame size={18} className="text-primary animate-pulse" />
            <p className="eyebrow text-amber-400">Live Streaming Charts</p>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Top 10 Today
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/60 max-w-xl">
            The most popular films and television series streamed on VEYRA over the past 24 hours. Updated continuously.
          </p>
        </section>

        {/* Top 10 Movies Section */}
        {movies.length > 0 && (
          <section aria-label="Top 10 Movies">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                  <Film size={18} />
                </div>
                <div>
                  <h2 className="section-title">Top 10 Movies Today</h2>
                  <p className="text-[11px] text-white/50">Ranked by current audience streams</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 no-scrollbar scroll-snap-rail">
              {movies.map((movie, index) => (
                <RankedCard
                  key={movie.id}
                  item={movie}
                  rank={index + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* Top 10 TV Shows Section */}
        {tv.length > 0 && (
          <section aria-label="Top 10 TV Shows">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-cyan/20 text-cyan border border-cyan/30">
                  <Tv size={18} />
                </div>
                <div>
                  <h2 className="section-title">Top 10 Series Today</h2>
                  <p className="text-[11px] text-white/50">Ranked by current episode playback</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-2 no-scrollbar scroll-snap-rail">
              {tv.map((show, index) => (
                <RankedCard
                  key={show.id}
                  item={show}
                  rank={index + 1}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </Shell>
  )
}
