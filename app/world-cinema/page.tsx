import type { Metadata } from 'next'
import { Shell } from '@/components/layout/Shell'
import { MediaRail } from '@/components/media/MediaRail'
import { CatalogFailureState } from '@/components/feedback/CatalogState'
import { loadCatalog } from '@/lib/catalog'
import { discover, type Media, type MediaType } from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'World Cinema — VEYRA',
  description: 'Explore international movies through TMDB metadata, organized by original language.',
}

const CINEMA_RAILS = [
  { label: 'Indian languages', languages: ['hi', 'ml', 'ta', 'te'] },
  { label: 'Korean cinema', languages: ['ko'] },
  { label: 'Japanese cinema', languages: ['ja'] },
  { label: 'European cinema', languages: ['fr', 'de', 'es', 'it'] },
] as const

type Feed = (Media & { media_type: MediaType })[]

async function loadRail(languages: readonly string[]) {
  return loadCatalog(async (): Promise<Feed> => {
    const responses = await Promise.all(languages.map((language) =>
      discover('movie', `with_original_language=${language}&sort_by=popularity.desc&vote_count.gte=20`),
    ))
    const seen = new Set<number>()
    return responses.flatMap((response) => response.results ?? [])
      .filter((item) => !seen.has(item.id) && seen.add(item.id))
      .map((item) => ({ ...item, media_type: 'movie' as const }))
      .slice(0, 20)
  })
}

export default async function WorldCinemaPage() {
  const rails = await Promise.all(CINEMA_RAILS.map((rail) => loadRail(rail.languages)))
  const successful = rails.filter((rail) => rail.status === 'success')

  return (
    <Shell>
      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-10 lg:px-8">
        <header className="max-w-2xl">
          <p className="eyebrow">Legitimate metadata rails</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white font-display md:text-5xl">World Cinema</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Explore stories by original language using TMDB metadata. VEYRA does not host or scrape a separate streaming catalog.
          </p>
        </header>
        <div className="mt-10 space-y-12">
          {CINEMA_RAILS.map((rail, index) => (
            rails[index].status === 'success'
              ? <MediaRail key={rail.label} title={rail.label} items={rails[index].data ?? []} href={`/discover?type=movie&language=${rail.languages[0]}`} />
              : null
          ))}
          {successful.length === 0 && <CatalogFailureState error={rails[0]?.error} />}
        </div>
      </main>
    </Shell>
  )
}
