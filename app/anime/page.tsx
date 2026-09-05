import type { Metadata } from 'next'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { AnimeHero } from '@/components/anime/AnimeHero'
import { AnimeRail } from '@/components/anime/AnimeRail'
import { EmptyState } from '@/components/feedback/EmptyState'
import { getAiringAnime, getAnimeMovies, getCurrentSeasonAnime, getPopularAnime, getTopRatedAnime, getTrendingAnime, type AnimeListItem } from '@/lib/anilist'

export const metadata: Metadata = {
  title: 'Anime — VEYRA',
  description: 'Discover trending, airing, and acclaimed anime through The Night Signal.',
  alternates: { canonical: '/anime' },
  openGraph: { title: 'Anime — VEYRA', description: 'Discover anime through The Night Signal.' },
}

type RailResult = { items: AnimeListItem[]; failed: boolean }

async function loadRail(loader: () => Promise<AnimeListItem[]>): Promise<RailResult> {
  try {
    const items = await loader()
    return { items, failed: false }
  } catch {
    return { items: [], failed: true }
  }
}

export default async function AnimePage() {
  const [trending, airing, season, topRated, movies, popular] = await Promise.all([
    loadRail(getTrendingAnime),
    loadRail(getAiringAnime),
    loadRail(getCurrentSeasonAnime),
    loadRail(getTopRatedAnime),
    loadRail(getAnimeMovies),
    loadRail(getPopularAnime),
  ])
  const allFailed = [trending, airing, season, topRated, movies, popular].every((result) => result.failed)

  return (
    <Shell>
      {trending.items[0] && <AnimeHero item={trending.items[0]} />}
      {allFailed ? (
        <div className="px-5 pt-8 lg:px-8"><EmptyState title="Anime signal unavailable" description="AniList is temporarily unavailable. Movie and TV discovery remain available while the signal reconnects." variant="error" action={<Link href="/" className="text-primary underline underline-offset-4">Return home</Link>} /></div>
      ) : (
        <>
          {trending.failed ? <FailureNotice label="Trending anime" /> : <AnimeRail title="Trending anime" items={trending.items.slice(1)} />}
          {airing.failed ? <FailureNotice label="Airing now" /> : <AnimeRail title="Airing now" items={airing.items} />}
          {season.failed ? <FailureNotice label="New this season" /> : <AnimeRail title="New this season" items={season.items} />}
          {topRated.failed ? <FailureNotice label="Top rated anime" /> : <AnimeRail title="Top rated anime" items={topRated.items} />}
          {movies.failed ? <FailureNotice label="Anime movies" /> : <AnimeRail title="Anime movies" items={movies.items} />}
          {popular.failed ? <FailureNotice label="Popular anime" /> : <AnimeRail title="Popular anime" items={popular.items} href="/anime" />}
        </>
      )}
    </Shell>
  )
}

function FailureNotice({ label }: { label: string }) {
  return <p role="status" className="mx-5 mt-10 rounded-xl border border-white/10 bg-white/[.02] px-4 py-3 text-xs text-muted-foreground lg:mx-8">{label} is temporarily unavailable.</p>
}
