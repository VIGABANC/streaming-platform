import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, CircleOff } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { getAnimeDetail } from '@/lib/jikan/client'
import { isStrictPositiveInteger } from '@/lib/player'
import { serializeJsonLd } from '@/lib/seo/json-ld'

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

  const anime = await getAnimeDetail(id)
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
                <CircleOff size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="font-semibold text-white">Playback unavailable</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">VEYRA has no verified anime episode provider. No iframe or playback claim is presented.</p>
                  <Link href={`/watch/anime/${id}/1`} className="mt-4 inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white hover:border-primary hover:text-primary">View episode availability</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Shell>
  )
}
