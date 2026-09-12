import type { Metadata } from 'next'
import { Shell } from '@/components/layout/Shell'
import { CatalogFailureState } from '@/components/feedback/CatalogState'
import { AnimeDetail } from '@/components/anime/AnimeDetail'
import { getAnimeDetail } from '@/lib/anilist'
import { loadCatalog } from '@/lib/catalog'

interface AnimeDetailPageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: AnimeDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const result = await loadCatalog(() => getAnimeDetail(id))
  if (result.status !== 'success' || !result.data) return { title: 'Anime — VEYRA' }
  return { title: `${result.data.title} — VEYRA`, description: result.data.overview || `Explore ${result.data.title} on VEYRA.` }
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params
  const result = await loadCatalog(() => getAnimeDetail(id))
  return <Shell>{result.status === 'success' && result.data ? <AnimeDetail item={result.data} /> : <div className="mx-auto max-w-2xl px-5 py-24"><CatalogFailureState error={result.error} resetHref="/anime" /></div>}</Shell>
}
