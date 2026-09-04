import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Compass, Film, Tv } from 'lucide-react'
import { Shell } from '@/components/layout/Shell'
import { MediaRail } from '@/components/media/MediaRail'
import { providerLogo, discoverByProvider, type Media, type MediaType, type WatchProvider } from '@/lib/tmdb'

async function safeDiscover(type: MediaType, providerId: number) {
  try {
    const data = await discoverByProvider(type, providerId, 'US', type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc')
    return (data.results ?? []).map((item) => ({ ...item, media_type: type })) as (Media & { media_type: MediaType })[]
  } catch { return [] }
}

export async function ProviderCatalog({ provider, providerHref }: { provider: WatchProvider; providerHref: string }) {
  const [movies, shows] = await Promise.all([safeDiscover('movie', provider.provider_id), safeDiscover('tv', provider.provider_id)])
  const label = provider.provider_name.replace('Amazon Prime Video', 'Prime Video').replace('HBO Max', 'Max')
  return <Shell><main className="px-5 pb-24 pt-10 lg:px-10"><div className="mx-auto max-w-[1440px]"><Link href="/providers" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/50 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><ArrowLeft className="size-4" /> All signals</Link><header className="mt-10 flex flex-col gap-7 border-b border-white/10 pb-10 md:flex-row md:items-end md:justify-between"><div className="flex items-center gap-5"><div className="grid size-16 place-items-center rounded-2xl bg-white p-3 shadow-2xl shadow-black/30"><Image src={providerLogo(provider.logo_path, 'w154')} alt={`${label} logo`} width={64} height={64} className="max-h-11 w-auto object-contain" /></div><div><p className="eyebrow">Provider catalog</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-6xl">{label} on VEYRA</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/55">Discover the latest movies and series available on {label}.</p></div></div><nav className="flex flex-wrap items-center gap-2" aria-label="Catalog type"><Link href={providerHref} className="inline-flex items-center gap-2 rounded-full border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"><Compass className="size-3.5" /> All</Link><Link href={`${providerHref}?type=movie`} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:border-white/30 hover:text-white"><Film className="size-3.5" /> Movies</Link><Link href={`${providerHref}?type=tv`} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:border-white/30 hover:text-white"><Tv className="size-3.5" /> Series</Link></nav></header><div className="mt-10 space-y-12"><MediaRail title="Newest movies" items={movies} /><MediaRail title="Newest series" items={shows} /></div></div></main></Shell>
}
