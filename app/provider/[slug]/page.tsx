import { notFound, redirect } from 'next/navigation'
import { getProviders } from '@/lib/tmdb'

export default async function ProviderRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const providers = await getProviders().catch(() => [])
  const normalized = slug.replace(/-plus$/, '+').replace(/-/g, ' ')
  const provider = providers.find((item) => item.provider_name.toLowerCase().replace(/\+/g, ' plus').replace(/[^a-z0-9]+/g, ' ').trim() === normalized.toLowerCase().trim() || item.provider_name.toLowerCase().includes(normalized.toLowerCase()))
  if (!provider) notFound()
  redirect(`/streaming/${provider.provider_id}`)
}
