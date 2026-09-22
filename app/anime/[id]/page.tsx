import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CircleOff, PlayCircle } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { getAnimeDetail, getAnimeEpisodes } from '@/lib/jikan/client'
import { isStrictPositiveInteger } from '@/lib/player'
import { getConsumetHealth } from '@/lib/provider-health'
import { getCachedAnimePlayback } from '@/lib/anime-playback'
import { serializeJsonLd } from '@/lib/seo/json-ld'

// The playback card reflects the server-side Consumet configuration — it must
// not be prerendered at build time.
export const dynamic = 'force-dynamic'

interface AnimeDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: AnimeDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const anime = await getAnimeDetail(id)
  return {
    title: anime ? `${anime.title} — VEYRA` : `Anime ${id} — VEYRA`,
    description: anime?.synopsis || 'Anime metadata and playback availability on VEYRA.',
  }
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params
  if (!isStrictPositiveInteger(id)) notFound()

  const [anime, episodes] = await Promise.all([
    getAnimeDetail(id),
    getAnimeEpisodes(id).catch(() => []),
  ])
  const consumetHealth = await getConsumetHealth()
  const cachedPlayback = getCachedAnimePlayback(Number(id), 1)
  const title = anime?.title || `Anime ${id}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    image: anime?.image || undefined,
    description: anime?.synopsis || 'Anime metadata and playback availability on VEYRA.',
    datePublished: anime?.airedFrom || undefined,
    numberOfEpisodes: anime?.episodes || undefined,
    aggregateRating: anime?.score ? {
      '@type': 'AggregateRating',
      ratingValue: anime.score,
      bestRating: '10',
    } : undefined,
    genre: anime?.genres || [],
  }

  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <article className="mx-auto max-w-[1100px] px-5 py-10 lg:px-10">
        <Link href="/anime" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-white">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to anime
        </Link>

        <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
          {anime?.image ? (
            <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-surface ring-1 ring-white/10">
              <Image src={anime.image} alt={`${title} poster`} fill sizes="220px" className="object-cover" priority />
            </div>
          ) : (
            <div className="grid aspect-[2/3] place-items-center rounded-2xl border border-white/10 bg-surface text-white/40">
              <span className="text-xs">Poster unavailable</span>
            </div>
          )}

          <div>
            <p className="eyebrow">Anime signal</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white font-display md:text-5xl">{title}</h1>
            {anime ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {anime.type && <span>{anime.type}</span>}
                  {anime.status && <span>{anime.status}</span>}
                  {anime.episodes != null && <span>{anime.episodes} episodes</span>}
                  {anime.score != null && <span>{anime.score.toFixed(1)} community score</span>}
                </div>
                {anime.genres.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{anime.genres.map((genre) => <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">{genre}</span>)}</div>}
                {anime.synopsis && <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">{anime.synopsis}</p>}
              </>
            ) : (
              <p role="alert" className="mt-6 max-w-xl rounded-xl border border-amber-400/30 bg-amber-400/5 p-5 text-sm leading-6 text-amber-100">
                Anime metadata is temporarily unavailable. Try again later.
              </p>
            )}

            <div className="mt-8 rounded-xl border border-white/10 bg-surface/50 p-5">
              <div className="flex items-start gap-3">
                {cachedPlayback?.status === 'ready' ? <PlayCircle size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> : <CircleOff size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />}
                <div>
                  <h2 className="font-semibold text-white">
                    {cachedPlayback?.status === 'ready' ? `Playback available — Episode 1` : !consumetHealth.configured || !consumetHealth.reachable ? 'Playback unavailable' : 'Playback availability varies by episode'}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {!consumetHealth.configured
                      ? 'No anime provider is configured.'
                      : consumetHealth.status === 'self-reference'
                        ? 'The configured Consumet URL points back to VEYRA. A separate reachable Consumet instance is required.'
                        : !consumetHealth.reachable
                          ? 'The configured anime provider could not be verified.'
                          : cachedPlayback?.status === 'ready'
                            ? 'Streams provided by a self-hosted Consumet instance.'
                            : 'Source availability is checked when you open an episode.'}
                  </p>
                  {cachedPlayback?.status === 'ready' && <p className="mt-1 text-xs leading-5 text-white/45">Streams provided by a self-hosted Consumet instance. VEYRA does not host or verify this content.</p>}
                  {cachedPlayback?.status === 'ready' ? (
                    <Link href={`/watch/anime/${id}/1`} className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white hover:border-primary hover:text-primary">Watch episode 1</Link>
                  ) : episodes.length > 0 ? (
                    <Link href="#episodes" className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white hover:border-primary hover:text-primary">View episode list</Link>
                  ) : (
                    <span className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/10 px-4 text-xs font-semibold text-white/45">Episode list unavailable</span>
                  )}
                </div>
              </div>
            </div>

            {episodes.length > 0 && (
              <section id="episodes" aria-labelledby="episodes-title" className="mt-8 rounded-xl border border-white/10 bg-surface/50 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id="episodes-title" className="font-semibold text-white">Episode list</h2>
                  <span className="text-xs text-white/45">Metadata only</span>
                </div>
                <ul className="mt-4 divide-y divide-white/5">
                  {episodes.map((episode) => (
                    <li key={episode.number}>
                      <Link href={`/watch/anime/${id}/${episode.number}`} className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-white/5 transition-colors">
                        <span className="w-10 shrink-0 text-xs font-bold text-primary">E{episode.number}</span>
                        <span className="flex-1 truncate text-white/85">{episode.title || `Episode ${episode.number}`}</span>
                        {episode.aired && <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{episode.aired.slice(0, 10)}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>
    </Shell>
  )
}
