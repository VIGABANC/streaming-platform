import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { MapPin, Calendar, ExternalLink, Film, Tv } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaRail } from '@/components/media/MediaRail'
import { MediaGrid } from '@/components/media/MediaGrid'
import {
  getPersonDetail,
  profileImage,
  type PersonCreditCast,
  type MediaType,
  type Media,
} from '@/lib/tmdb'

interface PersonPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PersonPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const person = await getPersonDetail(id)
    return {
      title: `${person.name} — VEYRA`,
      description: person.biography?.slice(0, 155) || `Explore ${person.name}'s filmography on VEYRA.`,
    }
  } catch {
    return { title: 'Person — VEYRA' }
  }
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params

  let person
  try {
    person = await getPersonDetail(id)
  } catch {
    notFound()
  }

  const castCredits: (PersonCreditCast & { media_type: MediaType })[] = (
    person.combined_credits?.cast ?? []
  )
    .filter((c) => c.media_type === 'movie' || c.media_type === 'tv')
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))

  const knownFor = castCredits.slice(0, 12) as (Media & { media_type: MediaType })[]
  const allFilms = castCredits.filter((c) => c.media_type === 'movie').slice(0, 40) as (Media & { media_type: MediaType })[]
  const allTV = castCredits.filter((c) => c.media_type === 'tv').slice(0, 40) as (Media & { media_type: MediaType })[]

  const age = person.birthday
    ? Math.floor(
        (Date.now() - new Date(person.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
      )
    : null

  const imdbId = person.external_ids?.imdb_id || person.imdb_id

  return (
    <Shell>
      {/* Header */}
      <section className="relative overflow-hidden pb-12 pt-8" aria-label={`${person.name} profile`}>
        {/* Blurred profile bg */}
        <div className="absolute inset-0 z-0">
          <Image
            src={profileImage(person.profile_path)}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-top opacity-15 filter blur-2xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-transparent to-[#050507]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1440px] px-5 lg:px-12">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-10">
            {/* Profile photo */}
            <div className="relative mx-auto h-48 w-48 shrink-0 overflow-hidden rounded-full ring-4 ring-white/10 shadow-2xl sm:mx-0 sm:h-56 sm:w-56"
              style={{ boxShadow: '0 0 60px rgba(229,9,20,0.15), 0 24px 60px rgba(0,0,0,0.8)' }}>
              <Image
                src={profileImage(person.profile_path)}
                alt={person.name}
                fill
                sizes="224px"
                className="object-cover"
                priority
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              {person.known_for_department && (
                <p className="eyebrow mb-2">{person.known_for_department}</p>
              )}
              <h1 className="font-display text-4xl font-extrabold tracking-tight text-white md:text-6xl">
                {person.name}
              </h1>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start items-center gap-x-5 gap-y-2 text-xs text-white/70">
                {person.birthday && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" />
                    <span>
                      {new Date(person.birthday).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                      {age && !person.deathday ? ` (age ${age})` : ''}
                    </span>
                  </span>
                )}
                {person.place_of_birth && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-cyan" />
                    <span>{person.place_of_birth}</span>
                  </span>
                )}
                {imdbId && (
                  <a
                    href={`https://www.imdb.com/name/${imdbId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 text-amber-400 font-semibold hover:bg-amber-400/20 transition-colors"
                  >
                    <ExternalLink size={11} />
                    IMDb
                  </a>
                )}
              </div>

              {/* Biography */}
              {person.biography && (
                <div className="mt-5 max-w-3xl">
                  <p className="text-sm leading-relaxed text-white/75 line-clamp-5 sm:line-clamp-none">
                    {person.biography}
                  </p>
                </div>
              )}

              {/* Credit stats */}
              <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-4">
                <div className="glass-panel rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <p className="text-xl font-bold text-white font-display">{allFilms.length}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">Movies</p>
                </div>
                <div className="glass-panel rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <p className="text-xl font-bold text-white font-display">{allTV.length}</p>
                  <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">TV Shows</p>
                </div>
                {person.popularity && (
                  <div className="glass-panel rounded-xl px-4 py-3 text-center min-w-[80px]">
                    <p className="text-xl font-bold text-primary font-display">
                      {Math.round(person.popularity)}
                    </p>
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">Popularity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Known For rail */}
      {knownFor.length > 0 && (
        <MediaRail title="Known For" items={knownFor} />
      )}

      {/* Movies grid */}
      {allFilms.length > 0 && (
        <section className="px-5 py-8 lg:px-12" aria-label="Movies">
          <h2 className="section-title mb-5 flex items-center gap-2">
            <Film size={18} className="text-primary" />
            Movies
          </h2>
          <MediaGrid items={allFilms.slice(0, 24)} />
          {allFilms.length > 12 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing top {Math.min(allFilms.length, 24)} of {allFilms.length} movies
            </p>
          )}
        </section>
      )}

      {/* TV grid */}
      {allTV.length > 0 && (
        <section className="px-5 py-8 lg:px-12" aria-label="TV Shows">
          <h2 className="section-title mb-5 flex items-center gap-2">
            <Tv size={18} className="text-cyan" />
            TV Shows
          </h2>
          <MediaGrid items={allTV.slice(0, 24)} />
        </section>
      )}
    </Shell>
  )
}
