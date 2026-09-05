import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, ChevronRight, Clock, Users, Wrench } from 'lucide-react'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { AnimeDetailActions } from '@/components/anime/AnimeDetailActions'
import { AnimeRail } from '@/components/anime/AnimeRail'
import { AnimeTrailer } from '@/components/anime/AnimeTrailer'
import { EmptyState } from '@/components/feedback/EmptyState'
import { getAnimeDetail, type AnimeDetail } from '@/lib/anilist'
import { parsePositiveIntSegment } from '@/lib/http/validation'
import { serializeJsonLd } from '@/lib/seo/json-ld'
import { getAnimeProviderAvailability } from '@/lib/media/mapping'
import { getWatchmodeLinks } from '@/lib/watchmode/client'
import { getJikanEnrichment } from '@/lib/jikan/client'

interface AnimeDetailPageProps { params: Promise<{ id: string }> }

async function loadAnime(id: string): Promise<AnimeDetail | null> {
  const safeId = parsePositiveIntSegment(id, { min: 1, max: 2_000_000_000 })
  if (safeId === null) return null
  try { return await getAnimeDetail(safeId) } catch { return null }
}

export async function generateMetadata({ params }: AnimeDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const anime = await loadAnime(id)
  if (!anime) return { title: 'Anime signal unavailable — VEYRA', description: 'The requested anime signal is unavailable.' }
  return {
    title: `${anime.title} — VEYRA`,
    description: anime.description || `Explore ${anime.title} on VEYRA.`,
    alternates: { canonical: `/anime/${anime.sourceId}` },
    openGraph: { title: `${anime.title} — VEYRA`, description: anime.description || `Explore ${anime.title} on VEYRA.`, images: anime.bannerUrl || anime.posterUrl ? [anime.bannerUrl || anime.posterUrl as string] : [] },
  }
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params
  const safeId = parsePositiveIntSegment(id, { min: 1, max: 2_000_000_000 })
  if (safeId === null) notFound()
  const anime = await loadAnime(String(safeId))

  if (!anime) return <Shell><div className="px-5 pt-12 lg:px-12"><EmptyState title="Anime signal unavailable" description="This anime could not be reached right now. Please try again later." variant="error" action={<Link href="/anime" className="text-primary underline underline-offset-4">Back to anime</Link>} /></div></Shell>

  const providerAvailability = await getAnimeProviderAvailability(anime, 'US')
  const watchmode = providerAvailability?.mapping && process.env.WATCHMODE_API_KEY
    ? await getWatchmodeLinks({ tmdbId: providerAvailability.mapping.tmdbId, mediaType: providerAvailability.mapping.tmdbKind, region: 'US' })
    : null
  const mal = process.env.ANIME_MAL_ENRICHMENT === 'true' && anime.externalIds?.malId
    ? await getJikanEnrichment(anime.externalIds.malId)
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': anime.format === 'MOVIE' ? 'Movie' : 'TVSeries',
    name: anime.title,
    alternateName: [anime.originalTitle, anime.romajiTitle].filter(Boolean),
    image: [anime.posterUrl, anime.bannerUrl].filter(Boolean),
    description: anime.description,
    datePublished: anime.year ? `${anime.year}-01-01` : undefined,
    genre: anime.genres,
    aggregateRating: anime.score ? { '@type': 'AggregateRating', ratingValue: anime.score, bestRating: 10 } : undefined,
  }

  return (
    <Shell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <section className="relative overflow-hidden pb-12 pt-6 lg:pb-16">
        {anime.bannerUrl && <Image src={anime.bannerUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/70 to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-8 lg:px-12">
          <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/" className="hover:text-white">Home</Link><ChevronRight size={12} aria-hidden="true" /><Link href="/anime" className="hover:text-white">Anime</Link><ChevronRight size={12} aria-hidden="true" /><span className="max-w-[220px] truncate text-white">{anime.title}</span></nav>
          <div className="flex flex-col gap-8 md:flex-row md:items-start lg:gap-12">
            <div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-white/10 md:w-64 lg:w-72"><Image src={anime.posterUrl || '/poster-fallback.svg'} alt={`${anime.title} poster`} fill sizes="(max-width: 768px) 192px, 288px" className="object-cover" priority /></div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-semibold text-primary">Anime</span>{anime.format && <span className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-white/80">{anime.format}</span>}{anime.status && <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-accent">{anime.status}</span>}</div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white font-display md:text-5xl lg:text-6xl text-balance">{anime.title}</h1>
              {anime.originalTitle && anime.originalTitle !== anime.title && <p className="mt-1 text-xs text-muted-foreground">Original title: <span className="text-white/80">{anime.originalTitle}</span></p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/80">{anime.year && <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-muted-foreground" />{anime.year}</span>}{anime.durationMinutes && <span className="inline-flex items-center gap-1.5"><Clock size={14} className="text-muted-foreground" />{anime.durationMinutes} min</span>}{anime.episodes && <span>{anime.episodes} episodes</span>}{anime.score && <span className="text-amber-400">{anime.score.toFixed(1)} / 10</span>}{mal?.rank && <span className="text-white/60">MAL rank #{mal.rank}</span>}</div>
              {anime.genres.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{anime.genres.map((genre) => <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">{genre}</span>)}</div>}
              {anime.description && <div className="mt-6 max-w-3xl"><h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Synopsis</h2><p className="text-sm leading-relaxed text-white/85 sm:text-base">{anime.description}</p></div>}
              {anime.airing?.nextAiringAt && <div className="mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm text-white"><p className="font-semibold text-accent">Next airing signal</p><p className="mt-1 text-white/75">Episode {anime.airing.nextEpisode ?? '—'} · {new Date(anime.airing.nextAiringAt).toLocaleString()}</p></div>}
              <AnimeDetailActions item={anime} />
            </div>
          </div>
        </div>
      </section>
      {anime.studios.length > 0 && <section className="px-5 py-6 lg:px-12" aria-label="Studios"><h2 className="section-title mb-4">Studios</h2><div className="flex flex-wrap gap-3">{anime.studios.map((studio) => <span key={studio.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80"><Wrench size={13} className="text-primary" />{studio.name}{studio.isMain && <span className="text-primary">Main</span>}</span>)}</div></section>}
      {providerAvailability && <section className="px-5 py-8 lg:px-12" aria-label="Provider availability"><h2 className="section-title mb-2">Where to watch</h2><p className="mb-4 text-xs text-muted-foreground">Availability shown for United States · sourced from TMDB</p><div className="flex flex-wrap gap-3">{[...(providerAvailability.providers.flatrate ?? []), ...(providerAvailability.providers.free ?? []), ...(providerAvailability.providers.ads ?? [])].filter((provider, index, all) => all.findIndex((candidate) => candidate.provider_id === provider.provider_id) === index).map((provider) => <span key={provider.provider_id} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">{provider.provider_name}</span>)}</div>{watchmode?.status === 'success' && watchmode.links.length > 0 && <div className="mt-4 flex flex-wrap gap-3">{watchmode.links.slice(0, 6).map((link) => <a key={`${link.providerId}-${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="text-xs text-cyan underline underline-offset-4">{link.name}</a>)}</div>}</section>}
      <AnimeTrailer anime={anime} />
      {anime.characters.length > 0 && <section className="px-5 py-8 lg:px-12" aria-label="Characters"><h2 className="section-title mb-5">Characters</h2><div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">{anime.characters.map((character) => <div key={character.id} className="w-24 shrink-0 text-center sm:w-28"><div className="relative mx-auto aspect-square w-20 overflow-hidden rounded-full bg-[#0A0D14] ring-1 ring-white/10 sm:w-24">{character.imageUrl && <Image src={character.imageUrl} alt="" fill sizes="96px" className="object-cover" />}</div><p className="mt-2 truncate text-xs font-semibold text-white">{character.name}</p><p className="truncate text-[11px] text-muted-foreground">{character.role || 'Character'}</p></div>)}</div></section>}
      {anime.staff.length > 0 && <section className="px-5 py-6 lg:px-12" aria-label="Staff"><h2 className="section-title mb-4">Staff</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{anime.staff.map((person) => <div key={`${person.id}-${person.role}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.02] p-3"><Users size={16} className="shrink-0 text-cyan" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{person.name}</p><p className="truncate text-xs text-muted-foreground">{person.role}</p></div></div>)}</div></section>}
      {anime.relations.length > 0 && <section className="px-5 py-8 lg:px-12" aria-label="Relations"><h2 className="section-title mb-5">Relations</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{anime.relations.map((relation) => <Link key={`${relation.relation}-${relation.media.sourceId}`} href={`/anime/${relation.media.sourceId}`} className="rounded-xl border border-white/10 bg-white/[.02] p-4 transition-colors hover:border-primary/50"><p className="text-[10px] font-bold uppercase tracking-wider text-primary">{relation.relation.replaceAll('_', ' ')}</p><p className="mt-1 truncate text-sm font-semibold text-white">{relation.media.title}</p></Link>)}</div></section>}
      {anime.recommendations.length > 0 && <AnimeRail title="Recommended anime" items={anime.recommendations} />}
    </Shell>
  )
}
