import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProviderCatalog } from '@/components/providers/ProviderCatalog'
import { getProviders } from '@/lib/tmdb'
import { providerSlug } from '@/lib/providers'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const providers = await getProviders().catch(() => [])
  const provider = providers.find((item) => providerSlug(item.provider_name) === slug)
  return { title: provider ? `${provider.provider_name} on VEYRA` : 'Provider not found', description: provider ? `Discover the latest movies and series available on ${provider.provider_name}.` : 'Streaming provider catalog.' }
}

export default async function ProviderRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const providers = await getProviders().catch(() => [])
  const provider = providers.find((item) => providerSlug(item.provider_name) === slug)
  if (!provider) notFound()
  return <ProviderCatalog provider={provider} providerHref={`/provider/${slug}`} />
}
