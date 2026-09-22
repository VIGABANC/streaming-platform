import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, CircleOff, ExternalLink, ListVideo, Tv } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { PlayerFrame, type ProviderHealthInfo } from '@/components/player/PlayerFrame'
import { isStrictPositiveInteger } from '@/lib/player'
import { resolveAnimePlayback } from '@/lib/anime-playback'
import type { ConsumetHealthResult } from '@/lib/provider-health'
import { getAnimeDetail } from '@/lib/jikan/client'

// The watch state depends on the server-side Consumet configuration and a
// live health probe — it must never be prerendered at build time.
export const dynamic = 'force-dynamic'

interface AnimeWatchPageProps {
  params: Promise<{ id: string; episode: string }>
}

function legalSearchUrl(provider: 'crunchyroll' | 'netflix', query: string): string {
  const encoded = encodeURIComponent(query)
  return provider === 'crunchyroll'
    ? `https://www.crunchyroll.com/search?q=${encoded}`
    : `https://www.netflix.com/search?q=${encoded}`
}

function toPlayerHealth(health: ConsumetHealthResult): ProviderHealthInfo[] {
  return [{
    id: health.id,
    name: health.name,
    origin: health.origin ?? '',
    dnsResolved: health.dnsResolved,
    reachable: health.reachable,
    status: health.status ?? 'unverified',
    latencyMs: health.latencyMs,
    lastCheckedAt: health.lastCheckedAt,
    error: health.error,
  }]
}

export async function generateMetadata({ params }: AnimeWatchPageProps): Promise<Metadata> {
  const { id, episode } = await params
  const anime = isStrictPositiveInteger(id) ? await getAnimeDetail(id).catch(() => null) : null
  const title = anime?.title || `Anime ${id}`
  return {
    title: `Watch ${title} Episode ${episode} — VEYRA`,
    description: anime?.synopsis || `Anime episode ${episode} playback availability on VEYRA.`,
  }
}

export default async function AnimeWatchPage({ params }: AnimeWatchPageProps) {
  const { id, episode } = await params
  if (!isStrictPositiveInteger(id) || !isStrictPositiveInteger(episode)) notFound()

  const malId = Number(id)
  const episodeNumber = Number(episode)

  const [anime, playback] = await Promise.all([
    getAnimeDetail(malId).catch(() => null),
    resolveAnimePlayback({ malId, episodeNumber }).catch(() => null),
  ])

  const title = anime?.title || `Anime ${malId}`
  const searchQuery = anime?.title || title

  const episodeNumbers = playback?.status === 'ready' ? (playback.episodes ?? []).map((entry) => entry.number).sort((a, b) => a - b) : []
  const prevNumber = episodeNumbers.filter((number) => number < episodeNumber).pop()
  const nextNumber = episodeNumbers.find((number) => number > episodeNumber)
  const prevHref = prevNumber != null ? `/watch/anime/${id}/${prevNumber}` : undefined
  const nextHref = nextNumber != null ? `/watch/anime/${id}/${nextNumber}` : undefined

  const ready = playback?.status === 'ready' && playback.source
  const episodeListLink = (
    <Link
      href={`/anime/${id}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-semibold text-white hover:border-primary hover:text-primary transition-colors"
    >
      <ListVideo size={14} aria-hidden="true" />
      View episode list
    </Link>
  )

  return (
    <Shell>
      <div className="mx-auto max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href={`/anime/${id}`} className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft size={16} />
            <span>Back to anime details</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <Tv size={14} className="text-primary" aria-hidden="true" />
            <span>{title} • Episode {episodeNumber}</span>
          </div>
        </div>

        {ready && playback?.source ? (
          <>
            {/* Native video player — anime never renders an iframe */}
            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl bg-black">
              <PlayerFrame
                mediaType="anime"
                mediaId={id}
                episode={episodeNumber}
                title={`${title} Episode ${episodeNumber} playback`}
                episodeLabel={`Episode ${episodeNumber}`}
                artwork={anime?.image ?? undefined}
                backHref={`/anime/${id}`}
                nativeSources={[playback.source]}
                providerHealth={toPlayerHealth(playback.health)}
                nextEpisodeHref={nextHref}
                prevEpisodeHref={prevHref}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/45">
              Streams provided by a self-hosted Consumet instance. VEYRA does not host or verify this content.
            </p>
          </>
        ) : playback?.status === 'provider-unavailable' ? (
          <div className="rounded-2xl border border-white/10 bg-black p-8 text-center">
            <CircleOff size={36} className="mx-auto mb-4 text-primary" aria-hidden="true" />
            <h1 className="text-lg font-bold text-white font-display">Playback unavailable</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              No verified anime provider is configured. Configure a self-hosted Consumet instance to enable anime playback.
            </p>
            <p className="mt-3 text-xs text-white/45">{title} · Episode {episodeNumber}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">{episodeListLink}</div>
          </div>
        ) : playback?.status === 'episode-unavailable' ? (
          <div className="rounded-2xl border border-white/10 bg-black p-8 text-center">
            <CircleOff size={36} className="mx-auto mb-4 text-primary" aria-hidden="true" />
            <h1 className="text-lg font-bold text-white font-display">Episode not available on this provider</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              The configured provider has no source for this episode. No player is presented.
            </p>
            <p className="mt-3 text-xs text-white/45">{title} · Episode {episodeNumber}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {nextHref && (
                <Link href={nextHref} className="inline-flex min-h-11 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  Try next episode
                </Link>
              )}
              {episodeListLink}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-black p-8 text-center">
            <CircleOff size={36} className="mx-auto mb-4 text-primary" aria-hidden="true" />
            <h1 className="text-lg font-bold text-white font-display">Playback unavailable</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              No verified anime provider is configured. Configure a self-hosted Consumet instance to enable anime playback.
            </p>
            <p className="mt-3 text-xs text-white/45">{title} · Episode {episodeNumber}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <a
                href={legalSearchUrl('crunchyroll', searchQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-semibold text-white hover:border-primary hover:text-primary transition-colors"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Watch legally on Crunchyroll
              </a>
              <a
                href={legalSearchUrl('netflix', searchQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-xs font-semibold text-white hover:border-primary hover:text-primary transition-colors"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Watch legally on Netflix
              </a>
              {episodeListLink}
            </div>
          </div>
        )}

        {/* Jikan metadata */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-surface/50 p-6 backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="rounded bg-primary/20 px-2 py-0.5 font-bold uppercase tracking-wider text-primary text-[10px]">Anime</span>
              {anime?.type && <span>{anime.type}</span>}
              {anime?.status && <span>{anime.status}</span>}
              {anime?.episodes != null && <span>{anime.episodes} episodes</span>}
              {anime?.score != null && <span className="text-accent font-semibold">{anime.score.toFixed(1)} community score</span>}
            </div>
            <h2 className="text-2xl font-bold text-white font-display">{title}</h2>
            {anime?.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">{genre}</span>
                ))}
              </div>
            )}
            {anime?.synopsis && <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{anime.synopsis}</p>}
            {!anime && (
              <p role="status" className="text-sm text-muted-foreground">
                Anime metadata is temporarily unavailable. Try again later.
              </p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  )
}
