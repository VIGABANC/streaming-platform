import Link from 'next/link'
import Image from 'next/image'
import { Shell } from '@/components/layout/Shell'
import { getProviders, providerLogo } from '@/lib/tmdb'

export default async function ProvidersPage() {
  const providers = await getProviders().catch(() => [])
  return <Shell><section className="px-4 py-12 sm:px-6 lg:px-10"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-400">The signal map</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">Streaming platforms</h1><p className="mt-2 max-w-xl text-white/50">Browse movies and series by service. Availability may vary by region.</p><div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{providers.slice(0, 30).map((provider) => <Link key={provider.provider_id} href={`/provider/${provider.provider_name.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-')}`} className="flex min-h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] p-6 transition hover:-translate-y-1 hover:border-red-400/50 hover:bg-white/[.08]"><Image src={providerLogo(provider.logo_path, 'w154')} alt={`${provider.provider_name} logo`} width={154} height={52} className="max-h-12 w-auto max-w-full object-contain" /></Link>)}</div></section></Shell>
}
