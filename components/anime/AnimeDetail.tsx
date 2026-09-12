import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Clapperboard, Layers, Star } from 'lucide-react'
import { MediaDetailActions } from '@/components/media/MediaDetailActions'
import { MediaRail } from '@/components/media/MediaRail'
import type { AnimeDetail as AnimeDetailModel } from '@/lib/catalog-model'
import { formatRating } from '@/lib/utils'

function formatStatus(status?: string): string {
  return status ? status.replaceAll('_', ' ').toLocaleLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Unknown status'
}

export function AnimeDetail({ item }: { item: AnimeDetailModel }) {
  const title = item.title
  const poster = item.posterUrl || '/poster-fallback.svg'
  const backdrop = item.backdropUrl || item.posterUrl || '/backdrop-fallback.svg'

  return (
    <>
      <section className="relative overflow-hidden pb-12 pt-6 lg:pb-16" aria-labelledby="anime-title">
        <div className="absolute inset-0 z-0">
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover opacity-25 blur-[1px]" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/75 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col gap-8 px-5 pt-8 md:flex-row md:items-start lg:gap-12 lg:px-12">
          <div className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-white/10 md:w-64 lg:w-72">
            <Image src={poster} alt={`${title} poster`} fill sizes="(max-width: 768px) 192px, 288px" className="object-cover" priority />
          </div>

          <div className="max-w-3xl pt-2">
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-white">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/anime" className="hover:text-white">Anime</Link>
              <span aria-hidden="true">/</span>
              <span className="truncate text-white">{title}</span>
            </nav>
            <p className="eyebrow">Anime signal</p>
            <h1 id="anime-title" className="mt-2 text-4xl font-bold tracking-tight text-white font-display md:text-6xl">{title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded bg-primary/20 px-2 py-1 font-bold uppercase tracking-wider text-primary">Anime</span>
              {item.format && <span>{item.format}</span>}
              {item.release_date && <span>{item.release_date.slice(0, 4)}</span>}
              {item.vote_average ? <span className="flex items-center gap-1 text-amber-400"><Star size={13} fill="currentColor" />{formatRating(item.vote_average)}</span> : null}
              <span>{formatStatus(item.status)}</span>
            </div>
            {item.originalTitle && item.originalTitle !== title && <p className="mt-3 text-sm text-white/60">Original title: <span className="text-white/85">{item.originalTitle}</span></p>}
            {item.alternativeTitles.length > 0 && <p className="mt-1 text-sm text-white/50">Also known as: {item.alternativeTitles.join(' · ')}</p>}
            {item.overview && <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{item.overview}</p>}
            <MediaDetailActions item={item} mediaType="anime" watchHref="#episodes" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pb-10 lg:px-12" aria-label="Anime metadata">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-surface/50 p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Layers size={14} />Episodes</div><p className="mt-2 text-lg font-semibold text-white">{item.episodes ?? '—'}</p></div>
          <div className="rounded-xl border border-white/10 bg-surface/50 p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clapperboard size={14} />Format</div><p className="mt-2 text-lg font-semibold text-white">{item.format ?? '—'}</p></div>
          <div className="rounded-xl border border-white/10 bg-surface/50 p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar size={14} />Release</div><p className="mt-2 text-lg font-semibold text-white">{item.release_date || '—'}</p></div>
          <div className="rounded-xl border border-white/10 bg-surface/50 p-4"><p className="text-xs text-muted-foreground">Studios</p><p className="mt-2 text-sm font-semibold text-white">{item.studios?.join(', ') || 'Not listed'}</p></div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">{item.genres?.map((genre) => <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">{genre}</span>)}</div>
      </section>

      <section id="episodes" className="mx-auto max-w-[1440px] scroll-mt-20 px-5 pb-10 lg:px-12" aria-labelledby="episodes-title">
        <div className="mb-4 flex items-center gap-3"><span aria-hidden="true" className="h-px w-6 rounded-full bg-primary" /><h2 id="episodes-title" className="section-title">Seasons & Episodes</h2></div>
        {item.episodesList.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {item.episodesList.slice(0, 24).map((episode) => (
              <div key={episode.id} className="rounded-xl border border-white/10 bg-surface/50 p-4">
                <p className="text-xs font-semibold text-primary">Episode {episode.number}</p>
                <h3 className="mt-1 font-semibold text-white">{episode.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">Episode details will appear when the metadata source provides them.</p>
              </div>
            ))}
          </div>
        ) : <p role={item.episodesStatus === 'unavailable' ? 'alert' : undefined} className={`rounded-xl border border-dashed p-6 text-sm ${item.episodesStatus === 'unavailable' ? 'border-amber-400/30 bg-amber-400/5 text-amber-100' : 'border-white/10 text-muted-foreground'}`}>{item.episodesStatus === 'unavailable' ? 'Episode data is temporarily unavailable. Anime metadata is still available.' : 'No episode data is listed for this title.'}</p>}
      </section>

      {item.relations.length > 0 && <MediaRail title="Related Anime" items={item.relations} href="/anime" />}
      {item.recommendations.length > 0 && <MediaRail title="Recommended Anime" items={item.recommendations} href="/anime" />}

      <p className="mx-auto max-w-[1440px] px-5 pb-12 text-xs text-muted-foreground lg:px-12">Anime metadata provided by {item.attribution}. VEYRA does not host or verify playback sources on this page.</p>
    </>
  )
}
