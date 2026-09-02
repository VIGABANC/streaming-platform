import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Tv, Clock } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { PlayerFrame } from '@/components/player/PlayerFrame'
import { ContinueWatchingTracker } from '@/components/player/ContinueWatchingTracker'
import {
  getTVDetail,
  getSeason,
  titleOf,
  yearOf,
  backdrop,
  poster,
  formatRuntime,
  type TVDetail,
  type SeasonDetail,
  type Episode,
} from '@/lib/tmdb'
import { getTVEmbedUrl } from '@/lib/player'

interface TVWatchProps {
  params: Promise<{
    id: string
    season: string
    episode: string
  }>
}

export async function generateMetadata({ params }: TVWatchProps): Promise<Metadata> {
  const { id, season, episode } = await params
  try {
    const show = await getTVDetail(id)
    const title = titleOf(show)
    return {
      title: `Watch ${title} S${season} E${episode} — VEYRA`,
      description: `Stream ${title} Season ${season}, Episode ${episode} on VEYRA.`,
    }
  } catch {
    return {
      title: 'Watch Episode — VEYRA',
    }
  }
}

export default async function WatchTVPage({ params }: TVWatchProps) {
  const { id, season, episode } = await params
  const seasonNum = parseInt(season, 10) || 1
  const episodeNum = parseInt(episode, 10) || 1

  let show: TVDetail | null = null
  let seasonData: SeasonDetail | null = null

  try {
    const [showRes, seasonRes] = await Promise.all([
      getTVDetail(id),
      getSeason(id, seasonNum).catch(() => null),
    ])
    show = showRes
    seasonData = seasonRes
  } catch {
    // Graceful fallback
  }

  const title = show ? titleOf(show) : 'Series'
  const currentEpisode: Episode | undefined = seasonData?.episodes?.find(
    (e) => e.episode_number === episodeNum,
  )

  const episodeName = currentEpisode?.name || `Episode ${episodeNum}`
  const embedUrl = getTVEmbedUrl(id, seasonNum, episodeNum)
  const backdropUrl = show?.backdrop_path ? backdrop(show.backdrop_path, 'w1280') : undefined

  // Calculate Next / Previous Episode navigation
  const episodes = seasonData?.episodes ?? []
  const totalEpisodesInSeason = episodes.length || show?.seasons?.find((s) => s.season_number === seasonNum)?.episode_count || 0

  let prevHref: string | null = null
  let nextHref: string | null = null

  if (episodeNum > 1) {
    prevHref = `/watch/tv/${id}/${seasonNum}/${episodeNum - 1}`
  }

  if (totalEpisodesInSeason > 0 && episodeNum < totalEpisodesInSeason) {
    nextHref = `/watch/tv/${id}/${seasonNum}/${episodeNum + 1}`
  } else if (show?.seasons) {
    // Check if next season exists
    const nextSeason = show.seasons.find((s) => s.season_number === seasonNum + 1)
    if (nextSeason && nextSeason.episode_count > 0) {
      nextHref = `/watch/tv/${id}/${nextSeason.season_number}/1`
    }
  }

  return (
    <Shell>
      {show && (
        <ContinueWatchingTracker
          item={{
            id: show.id,
            media_type: 'tv',
            title,
            poster_path: show.poster_path,
            backdrop_path: show.backdrop_path,
            season: seasonNum,
            episode: episodeNum,
            episodeTitle: episodeName,
            lastOpenedAt: Date.now(),
          }}
        />
      )}

      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/tv/${id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to series</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Tv size={14} className="text-primary" />
            <span>
              {title} • S{seasonNum} E{episodeNum}
            </span>
          </div>
        </div>

        {/* Video Player Frame */}
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl bg-black">
          <PlayerFrame
            src={embedUrl}
            title={`${title} S${seasonNum} E${episodeNum} playback`}
            episodeLabel={`Season ${seasonNum}, Episode ${episodeNum} — ${episodeName}`}
            artwork={backdropUrl}
            backHref={`/tv/${id}`}
          />
        </div>

        {/* Episode Controls & Metadata */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-surface/50 p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <span>Season {seasonNum}</span>
                <span>•</span>
                <span>Episode {episodeNum}</span>
                {currentEpisode?.runtime && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={11} />
                      {formatRuntime(currentEpisode.runtime)}
                    </span>
                  </>
                )}
              </div>
              <h1 className="mt-1 text-xl font-bold text-white font-display md:text-2xl">
                {episodeName}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
            </div>

            {/* Prev / Next Episode Buttons */}
            <div className="flex items-center gap-2">
              {prevHref ? (
                <Link
                  href={prevHref}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white hover:border-primary hover:text-primary transition-colors"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/5 px-4 py-2 text-xs font-semibold text-white/30 cursor-not-allowed"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>
              )}

              {nextHref ? (
                <Link
                  href={nextHref}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                >
                  <span>Next Episode</span>
                  <ChevronRight size={14} />
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/5 px-4 py-2 text-xs font-semibold text-white/30 cursor-not-allowed"
                >
                  <span>Final Episode</span>
                </button>
              )}
            </div>
          </div>

          {currentEpisode?.overview && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground max-w-3xl">
              {currentEpisode.overview}
            </p>
          )}
        </div>

        {/* Quick Episode Carousel / List for the Current Season */}
        {episodes.length > 0 && (
          <div className="mt-8 mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">Season {seasonNum} Episodes</h2>
              <span className="text-xs text-muted-foreground">{episodes.length} episodes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {episodes.map((ep) => {
                const isCurrent = ep.episode_number === episodeNum
                return (
                  <Link
                    key={ep.id}
                    href={`/watch/tv/${id}/${seasonNum}/${ep.episode_number}`}
                    className={`rounded-xl p-3 border transition-all ${
                      isCurrent
                        ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                        : 'border-white/5 bg-surface/30 hover:border-white/20 hover:bg-surface/70'
                    }`}
                  >
                    <p className="text-xs font-semibold text-white truncate">
                      {ep.episode_number}. {ep.name}
                    </p>
                    {ep.overview && (
                      <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                        {ep.overview}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Shell>
  )
}
