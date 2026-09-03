import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Sparkles } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { Hero } from '@/components/media/Hero'
import { MediaRail } from '@/components/media/MediaRail'
import { MediaGrid } from '@/components/media/MediaGrid'
import {
  getByGenre,
  getTopRatedByGenre,
  getNewestByGenre,
  getGenreName,
  type MediaType,
} from '@/lib/tmdb'

interface GenrePageProps {
  params: Promise<{ type: string; id: string }>
}

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const { type, id } = await params
  const mediaType = (type === 'tv' ? 'tv' : 'movie') as MediaType
  const genreName = getGenreName(mediaType, Number(id))

  return {
    title: `${genreName} ${mediaType === 'tv' ? 'TV Shows' : 'Movies'} — VEYRA`,
    description: `Stream the best ${genreName} ${mediaType === 'tv' ? 'series' : 'films'} in 4K on VEYRA.`,
  }
}

export default async function GenreHubPage({ params }: GenrePageProps) {
  const { type, id } = await params
  if (type !== 'movie' && type !== 'tv') notFound()

  const mediaType = type as MediaType
  const genreId = Number(id)
  const genreName = getGenreName(mediaType, genreId)

  if (genreName === 'Unknown') notFound()

  const [popularRes, topRatedRes, newestRes] = await Promise.all([
    getByGenre(mediaType, genreId, 'popularity.desc').catch(() => ({ results: [] })),
    getTopRatedByGenre(mediaType, genreId).catch(() => ({ results: [] })),
    getNewestByGenre(mediaType, genreId).catch(() => ({ results: [] })),
  ])

  const popular = popularRes.results.map((m) => ({ ...m, media_type: mediaType }))
  const topRated = topRatedRes.results.map((m) => ({ ...m, media_type: mediaType }))
  const newest = newestRes.results.map((m) => ({ ...m, media_type: mediaType }))

  const spotlight = popular[0] || topRated[0]

  return (
    <Shell>
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-[1440px] px-5 pt-6 lg:px-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link href={mediaType === 'tv' ? '/tv' : '/movies'} className="hover:text-white transition-colors">
            {mediaType === 'tv' ? 'TV Shows' : 'Movies'}
          </Link>
          <ChevronRight size={12} />
          <span className="text-white font-medium">{genreName}</span>
        </nav>
      </div>

      {/* Spotlight Hero if available */}
      {spotlight && <Hero item={spotlight} />}

      {/* Genre Title Bar */}
      <div className="mx-auto max-w-[1440px] px-5 pt-8 lg:px-12 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#E50914]" />
            <p className="eyebrow">{mediaType === 'tv' ? 'TV Series Hub' : 'Film Hub'}</p>
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl mt-1">
            {genreName}
          </h1>
        </div>

        <Link
          href={`/discover?type=${mediaType}&genre=${genreId}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white/90 hover:border-primary/50 hover:bg-primary/10 hover:text-white transition-all hover:scale-105"
        >
          <Sparkles size={14} className="text-cyan" />
          Filter & Sort {genreName}
        </Link>
      </div>

      {/* Popular Rail */}
      {popular.length > 1 && (
        <MediaRail title={`Popular ${genreName}`} items={popular.slice(1)} />
      )}

      {/* Top Rated Rail */}
      {topRated.length > 0 && (
        <MediaRail title={`Highest Rated ${genreName}`} items={topRated} />
      )}

      {/* New Releases Rail */}
      {newest.length > 0 && (
        <MediaRail title={`Recent ${genreName} Releases`} items={newest} />
      )}

      {/* Complete Grid */}
      <section className="mx-auto max-w-[1440px] px-5 py-12 lg:px-12" aria-label={`All ${genreName} Titles`}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="section-title">Explore All {genreName}</h2>
          <span className="text-xs text-white/50">{popular.length} featured titles</span>
        </div>
        <MediaGrid items={popular} />
      </section>
    </Shell>
  )
}
