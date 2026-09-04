import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Compass, Film, Tv } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaRail } from '@/components/media/MediaRail'
import { providerLogo, discoverByProvider, getProviders, type Media, type MediaType } from '@/lib/tmdb'
import Image from 'next/image'

export const dynamicParams = true

type SearchParams = Promise<{ type?: string }>

async function safeDiscover(type: MediaType, providerId: number, sortBy: string) {
  try {
    const data = await discoverByProvider(type, providerId, 'US', sortBy)
    return (data.results ?? []).map((item) => ({ ...item, media_type: type })) as (Media & { media_type: MediaType })[]
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: { params: Promise<{ providerId: string }> }): Promise<Metadata> {
  const { providerId } = await params
  const providers = await getProviders().catch(() => [])
  const provider = providers.find((item) => item.provider_id === Number(providerId))
  return { title: `${provider?.provider_name ?? 'Streaming provider'} — VEYRA`, description: `Browse the newest movies and series available on ${provider?.provider_name ?? 'this streaming provider'}.` }
}

export default async function ProviderPage({ params, searchParams }: { params: Promise<{ providerId: string }>; searchParams?: SearchParams }) {
  const { providerId: rawId } = await params
  const providerId = Number(rawId)
  const [providers, query] = await Promise.all([getProviders().catch(() => []), searchParams ? searchParams : Promise.resolve({ type: undefined as string | undefined })])
  const provider = providers.find((item) => item.provider_id === providerId)
  if (!provider) {
    return <Shell><main className="px-6 py-24 text-center lg:px-10"><p className="eyebrow">Signal not found</p><h1 className="mt-3 text-4xl font-bold text-white">That provider is off-air.</h1><Link href="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft className="size-4" /> Return home</Link></main></Shell>
  }

  const selectedType = query.type === 'tv' ? 'tv' : query.type === 'movie' ? 'movie' : 'all'
  const [movies, shows] = await Promise.all([safeDiscover('movie', providerId, 'primary_release_date.desc'), safeDiscover('tv', providerId, 'first_air_date.desc')])
  const label = provider.provider_name.replace('Amazon Prime Video', 'Prime Video').replace('HBO Max', 'Max')

  return <Shell>
    <main className="px-5 pb-24 pt-10 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        <Link href="/#streaming-providers" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/50 transition hover:text-white"><ArrowLeft className="size-4" /> All signals</Link>
        <header className="mt-10 flex flex-col gap-7 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid size-16 place-items-center rounded-2xl bg-white p-3 shadow-2xl shadow-black/30"><Image src={providerLogo(provider.logo_path, 'w154')} alt="" width={64} height={64} className="max-h-11 w-auto object-contain" /></div>
            <div><p className="eyebrow">Provider catalog</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-6xl">{label}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/55">The newest signal from {label}, arranged for a faster decision tonight.</p></div>
          </div>
          <nav className="flex items-center gap-2" aria-label="Catalog type"><Link href={`/streaming/${providerId}`} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${selectedType === 'all' ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'}`}><Compass className="size-3.5" /> All</Link><Link href={`/streaming/${providerId}?type=movie`} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${selectedType === 'movie' ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'}`}><Film className="size-3.5" /> Movies</Link><Link href={`/streaming/${providerId}?type=tv`} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${selectedType === 'tv' ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 text-white/60 hover:border-white/30 hover:text-white'}`}><Tv className="size-3.5" /> Series</Link></nav>
        </header>
        <div className="mt-10 space-y-12">{(selectedType === 'all' || selectedType === 'movie') && <MediaRail title="Newest movies" items={movies} />}{(selectedType === 'all' || selectedType === 'tv') && <MediaRail title="Newest series" items={shows} />}{((selectedType === 'movie' && movies.length === 0) || (selectedType === 'tv' && shows.length === 0) || (selectedType === 'all' && movies.length === 0 && shows.length === 0)) && <div className="rounded-2xl border border-white/10 bg-white/[.03] px-6 py-16 text-center"><p className="text-lg font-semibold text-white">No titles found for this signal.</p><p className="mt-2 text-sm text-white/50">Try another catalog or return to all providers.</p></div>}</div>
      </div>
    </main>
  </Shell>
}
