import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Shell } from '@/components/layout/Shell'
import { MediaGrid } from '@/components/media/MediaGrid'
import { DiscoverFilters } from '@/components/discover/DiscoverFilters'
import { SkeletonGrid } from '@/components/feedback/Skeletons'
import { EmptyState } from '@/components/feedback/EmptyState'
import { discover, type Media, type MediaType } from '@/lib/tmdb'

export const metadata: Metadata = {
  title: 'Discover — VEYRA',
  description: 'Filter and discover movies and TV shows tailored to your taste on VEYRA.',
  openGraph: {
    title: 'Discover — VEYRA',
    description: 'Filter and discover movies and TV shows tailored to your taste on VEYRA.',
  },
}

interface DiscoverPageProps {
  searchParams: Promise<{
    type?: string
    genre?: string
    year?: string
    rating?: string
    sort?: string
    language?: string
    page?: string
  }>
}

async function DiscoverResults({ searchParams }: DiscoverPageProps) {
  const params = await searchParams
  const mediaType: MediaType = params.type === 'tv' ? 'tv' : 'movie'

  const queryParts: string[] = []

  if (params.genre) {
    queryParts.push(`with_genres=${encodeURIComponent(params.genre)}`)
  }

  if (params.year) {
    if (mediaType === 'movie') {
      queryParts.push(`primary_release_year=${encodeURIComponent(params.year)}`)
    } else {
      queryParts.push(`first_air_date_year=${encodeURIComponent(params.year)}`)
    }
  }

  if (params.rating) {
    queryParts.push(`vote_average.gte=${encodeURIComponent(params.rating)}`)
    queryParts.push('vote_count.gte=50') // meaningful vote count
  }

  if (params.language) {
    queryParts.push(`with_original_language=${encodeURIComponent(params.language)}`)
  }

  if (params.sort) {
    queryParts.push(`sort_by=${encodeURIComponent(params.sort)}`)
  } else {
    queryParts.push('sort_by=popularity.desc')
  }

  const queryString = queryParts.join('&')

  let items: (Media & { media_type: MediaType })[] = []
  let hasError = false
  let isConfigMissing = false

  try {
    const data = await discover(mediaType, queryString)
    items = (data.results ?? []).map((item) => ({
      ...item,
      media_type: mediaType,
    }))
  } catch (err) {
    hasError = true
    if (err instanceof Error && err.message.includes('TMDB_API_KEY_MISSING')) {
      isConfigMissing = true
    }
  }

  if (isConfigMissing) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
        <h3 className="text-lg font-bold text-white font-display">Catalog not connected</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Add your <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">TMDB_API_KEY</code> to{' '}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs font-mono">.env.local</code> to browse live filtered catalog results.
        </p>
      </div>
    )
  }

  if (hasError) {
    return (
      <EmptyState
        title="Could not load titles"
        description="There was an issue querying TMDB catalog. Please try adjusting your filters or reloading."
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No titles match your filter"
        description="Try relaxing your filters or selecting a different genre or release year."
        action={
          <a
            href={`/discover?type=${mediaType}`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground"
          >
            Reset filters
          </a>
        }
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>Showing top {items.length} titles</span>
        <span className="capitalize">{mediaType === 'tv' ? 'TV Series' : 'Movies'}</span>
      </div>
      <MediaGrid items={items} />
    </div>
  )
}

export default async function DiscoverPage(props: DiscoverPageProps) {
  return (
    <Shell>
      <div className="px-5 pt-10 lg:px-8">
        <div className="mb-8">
          <p className="eyebrow">Curated Discovery</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white font-display md:text-5xl">
            Discover
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Fine-tune by medium, genre, score, and release era.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <Suspense fallback={null}>
            <DiscoverFilters />
          </Suspense>

          <div className="flex-1 w-full min-w-0">
            <Suspense fallback={<SkeletonGrid count={12} />}>
              <DiscoverResults searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>
      </div>
    </Shell>
  )
}
