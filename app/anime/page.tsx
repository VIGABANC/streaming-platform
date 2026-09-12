import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { MediaGrid } from '@/components/media/MediaGrid'
import { CatalogEmptyState, CatalogFailureState } from '@/components/feedback/CatalogState'
import { loadCatalog } from '@/lib/catalog'
import { searchAnime } from '@/lib/anilist'

export const metadata: Metadata = {
  title: 'Anime — VEYRA',
  description: 'Discover anime series and anime movies by genre, status, score, and release season.',
}

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'RELEASING', label: 'Airing now' },
  { value: 'FINISHED', label: 'Completed' },
  { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
  { value: 'HIATUS', label: 'On hiatus' },
]

const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Sports']

interface AnimePageProps {
  searchParams: Promise<{ genre?: string; status?: string; sort?: string; format?: string }>
}

async function AnimeResults({ searchParams }: AnimePageProps) {
  const params = await searchParams
  const result = await loadCatalog(() => searchAnime({ genre: params.genre, status: params.status, sort: params.sort, format: params.format }))
  if (result.status === 'failure') return <CatalogFailureState error={result.error} resetHref="/anime" />
  if (result.status === 'empty') return <CatalogEmptyState resetHref="/anime" />
  return <MediaGrid items={result.data ?? []} />
}

export default function AnimePage(props: AnimePageProps) {
  const params = props.searchParams
  return (
    <Shell>
      <section className="mx-auto max-w-[1440px] px-5 pt-10 lg:px-8">
        <p className="eyebrow">The Anime Signal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white font-display md:text-5xl">Anime</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Explore anime series, anime movies, airing titles, completed classics, and upcoming releases.</p>
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Anime status filters">
          {statuses.map((status) => <Link key={status.value || 'all'} href={status.value ? `/anime?status=${status.value}` : '/anime'} className="rounded-full border border-white/10 bg-surface px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:border-primary hover:text-white">{status.label}</Link>)}
          <Link href="/anime?sort=SCORE_DESC" className="rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-200">Top rated</Link>
          <Link href="/anime?format=TV" className="rounded-full border border-cyan/20 bg-cyan/10 px-4 py-2 text-xs font-medium text-cyan">Anime series</Link>
          <Link href="/anime?format=MOVIE" className="rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-xs font-medium text-violet-200">Anime movies</Link>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar" aria-label="Anime genre filters">
          {genres.map((genre) => <Link key={genre} href={`/anime?genre=${encodeURIComponent(genre)}`} className="shrink-0 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/65 hover:border-primary/60 hover:text-white">{genre}</Link>)}
        </div>
      </section>
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 lg:px-8">
        <AnimeResults searchParams={params} />
      </div>
    </Shell>
  )
}
