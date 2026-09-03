import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Play, Film, Clock, Star, ChevronRight, Layers } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import {
  getCollection,
  backdrop,
  poster,
  titleOf,
  yearOf,
  formatRuntime,
} from '@/lib/tmdb'
import { formatRating } from '@/lib/utils'

interface CollectionPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const collection = await getCollection(id)
    return {
      title: `${collection.name} — VEYRA`,
      description: collection.overview || `Watch all movies in the ${collection.name} on VEYRA.`,
    }
  } catch {
    return { title: 'Collection — VEYRA' }
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params

  let collection
  try {
    collection = await getCollection(id)
  } catch {
    notFound()
  }

  // Sort chronologically by release date
  const parts = [...(collection.parts ?? [])].sort((a, b) => {
    const dateA = a.release_date || '9999'
    const dateB = b.release_date || '9999'
    return dateA.localeCompare(dateB)
  })

  const firstMovie = parts[0]
  const backdropSrc = backdrop(collection.backdrop_path, 'original')
  const posterSrc = poster(collection.poster_path, 'w500')

  const totalRuntime = parts.reduce((acc, p) => acc + (p.runtime || 0), 0)
  const avgRating = parts.length > 0
    ? (parts.reduce((acc, p) => acc + (p.vote_average || 0), 0) / parts.length).toFixed(1)
    : null

  return (
    <Shell>
      {/* Hero Banner */}
      <section className="relative overflow-hidden pb-12 pt-6 lg:pb-16" aria-label={collection.name}>
        {collection.backdrop_path && (
          <div className="absolute inset-0 z-0">
            <Image
              src={backdropSrc}
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-25 filter blur-[2px]"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/70 to-transparent" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 pt-8 lg:px-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link href="/movies" className="hover:text-white transition-colors">Movies</Link>
            <ChevronRight size={12} />
            <span className="text-white truncate max-w-[240px] font-medium">{collection.name}</span>
          </nav>

          <div className="flex flex-col gap-8 md:flex-row md:items-start lg:gap-12">
            {/* Poster Card */}
            <div
              className="relative aspect-[2/3] w-48 shrink-0 overflow-hidden rounded-2xl bg-[#0A0D14] shadow-2xl ring-1 ring-white/10 md:w-64 lg:w-72"
              style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(229,9,20,0.15)' }}
            >
              <Image
                src={posterSrc}
                alt={`${collection.name} poster`}
                fill
                sizes="(max-width: 768px) 192px, 288px"
                className="object-cover"
                priority
              />
            </div>

            {/* Info Column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 font-semibold text-primary">
                  <Layers size={12} />
                  Movie Franchise Collection
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white font-display md:text-5xl lg:text-6xl text-balance">
                {collection.name}
              </h1>

              {/* Metadata Badges */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/80 font-medium">
                <span className="flex items-center gap-1.5">
                  <Film size={14} className="text-primary" />
                  <span>{parts.length} Films</span>
                </span>
                {totalRuntime > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-cyan" />
                    <span>{formatRuntime(totalRuntime)} total</span>
                  </span>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Star size={14} fill="currentColor" />
                    <span>{avgRating} Avg Rating</span>
                  </span>
                )}
              </div>

              {/* Overview */}
              {collection.overview && (
                <p className="mt-6 text-sm leading-relaxed text-white/85 sm:text-base max-w-3xl">
                  {collection.overview}
                </p>
              )}

              {/* Primary CTA */}
              {firstMovie && (
                <div className="mt-8 flex items-center gap-3">
                  <Link
                    href={`/watch/movie/${firstMovie.id}`}
                    className="inline-flex h-12 items-center gap-2.5 rounded-full bg-primary px-8 font-bold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <Play size={18} fill="currentColor" aria-hidden="true" />
                    <span>Start Franchise (Part 1)</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chronological Franchise Timeline */}
      <section className="mx-auto max-w-[1440px] px-5 py-10 lg:px-12" aria-label="Franchise Timeline">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h2 className="section-title">Franchise Chronology ({parts.length} Films)</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {parts.map((movie, index) => (
            <div
              key={movie.id}
              className="relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0D14] p-3 transition-all hover:border-primary/40 hover:shadow-xl group"
            >
              <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                <span className="font-mono font-bold text-primary">Part {index + 1}</span>
                <span>{yearOf(movie)}</span>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black/40 mb-3">
                <Image
                  src={backdrop(movie.backdrop_path || movie.poster_path, 'w780')}
                  alt={titleOf(movie)}
                  fill
                  sizes="320px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    href={`/watch/movie/${movie.id}`}
                    className="grid size-11 place-items-center rounded-full bg-primary text-white shadow-lg scale-90 group-hover:scale-100 transition-transform"
                  >
                    <Play size={16} fill="white" className="ml-0.5" />
                  </Link>
                </div>
              </div>

              <Link href={`/movie/${movie.id}`} className="font-semibold text-sm text-white hover:text-primary transition-colors line-clamp-1">
                {titleOf(movie)}
              </Link>

              {movie.vote_average ? (
                <div className="mt-1 flex items-center gap-1 text-xs text-amber-400 font-bold">
                  <Star size={11} fill="currentColor" />
                  <span>{formatRating(movie.vote_average)}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </Shell>
  )
}
