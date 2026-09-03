import { StreamingExplorer } from '@/components/streaming/StreamingExplorer'
import { discover, getProviders, getPopularMovies } from '@/lib/tmdb'

export const metadata = { title: 'Streaming Guide', description: 'Find what to watch across your favorite streaming services.' }

export default async function StreamingPage() {
  const [providers, movies, shows] = await Promise.all([
    getProviders().catch(() => []),
    getPopularMovies().catch(() => ({ results: [] })),
    discover('tv', 'sort_by=popularity.desc').catch(() => ({ results: [] })),
  ])
  return <StreamingExplorer providers={providers} initialItems={[...movies.results, ...shows.results].slice(0, 30)} />
}
