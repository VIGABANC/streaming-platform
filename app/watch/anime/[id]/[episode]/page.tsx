import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { PlayerFrame } from '@/components/player/PlayerFrame'
import { ContinueWatchingTracker } from '@/components/player/ContinueWatchingTracker'
import { getAnimeDetail } from '@/lib/anilist'
import { parsePositiveIntSegment } from '@/lib/http/validation'
import { createAnimeWatchContext } from '@/lib/watch-state'

interface AnimeWatchProps {
  params: Promise<{ id: string; episode: string }>
}

export async function generateMetadata({ params }: AnimeWatchProps): Promise<Metadata> {
  const { id, episode } = await params
  try {
    const anime = await getAnimeDetail(id)
    return {
      title: `Watch ${anime.title} Episode ${episode} — VEYRA`,
      description: `Anime episode ${episode} for ${anime.title} on VEYRA.`,
    }
  } catch {
    return { title: `Watch Anime Episode ${episode} — VEYRA` }
  }
}

export default async function WatchAnimePage({ params }: AnimeWatchProps) {
  const { id, episode } = await params
  const idNum = parsePositiveIntSegment(id, { min: 1, max: Number.MAX_SAFE_INTEGER })
  const episodeNum = parsePositiveIntSegment(episode, { min: 1, max: 100_000 })
  if (idNum == null || episodeNum == null) notFound()

  let anime: Awaited<ReturnType<typeof getAnimeDetail>> | null = null
  try {
    anime = await getAnimeDetail(idNum)
  } catch {
    // The player remains truthful when anime metadata or playback providers are unavailable.
  }

  const title = anime?.title ?? 'Anime'
  const currentEpisode = anime?.episodesList.find((item) => item.number === episodeNum)
  const episodes = anime?.episodesList ?? []
  const previousEpisode = episodes.find((item) => item.number === episodeNum - 1)
  const nextEpisode = episodes.find((item) => item.number === episodeNum + 1)

  return (
    <Shell>
      <ContinueWatchingTracker item={createAnimeWatchContext({
        id: idNum,
        title,
        posterPath: anime?.poster_path,
        backdropPath: anime?.backdrop_path,
        episode: episodeNum,
        episodeTitle: currentEpisode?.title,
      })} />
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/anime/${idNum}`} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white">
            <ArrowLeft size={16} /> Back to anime details
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/50"><Sparkles size={14} className="text-primary" />{title} • Episode {episodeNum}</div>
        </div>
        <div className="overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
          <PlayerFrame
            mediaType="anime"
            mediaId={idNum}
            episode={episodeNum}
            title={`${title} Episode ${episodeNum} playback`}
            episodeLabel={`Episode ${episodeNum}${currentEpisode ? ` — ${currentEpisode.title}` : ''}`}
            artwork={anime?.backdropUrl ?? undefined}
            backHref={`/anime/${idNum}`}
          />
        </div>
        <div className="mt-6 mb-12 rounded-2xl border border-white/5 bg-surface/50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-semibold text-primary">Anime episode {episodeNum}</p><h1 className="mt-1 text-xl font-bold text-white font-display md:text-2xl">{currentEpisode?.title ?? `Episode ${episodeNum}`}</h1><p className="text-xs text-muted-foreground">{title}</p></div>
            <div className="flex items-center gap-2">
              {previousEpisode ? <Link href={`/watch/anime/${idNum}/${previousEpisode.number}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:border-primary hover:text-primary"><ChevronLeft size={14} />Previous</Link> : <button disabled className="inline-flex items-center gap-1.5 rounded-full border border-white/5 px-4 py-2 text-xs text-white/30"><ChevronLeft size={14} />Previous</button>}
              {nextEpisode ? <Link href={`/watch/anime/${idNum}/${nextEpisode.number}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground"><span>Next Episode</span><ChevronRight size={14} /></Link> : <button disabled className="inline-flex items-center gap-1.5 rounded-full border border-white/5 px-4 py-2 text-xs text-white/30">Final Episode</button>}
            </div>
          </div>
          {currentEpisode?.overview && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">{currentEpisode.overview}</p>}
        </div>
      </div>
    </Shell>
  )
}
