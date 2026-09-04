import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { providerLogo, type WatchProvider } from '@/lib/tmdb'
import { curateProviders, providerAccentClasses, providerSurfaceClasses } from '@/lib/providers'

export function ProviderRail({ providers }: { providers: WatchProvider[] }) {
  const items = curateProviders(providers)
  if (!items.length) return null

  return (
    <section aria-labelledby="platforms-heading" className="space-y-6 px-4 py-12 sm:px-6 lg:px-10">
      <div className="flex items-end justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-400">The signal map</p>
          <h2 id="platforms-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Choose your signal</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/45">Explore what&apos;s new across the services you know.</p>
        </div>
        <Link href="/providers" className="hidden items-center gap-1.5 text-sm font-medium text-white/55 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:flex">View all <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
      </div>
      <div role="list" aria-label="Streaming services" className="flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((provider) => (
          <Link key={provider.provider_id} href={`/provider/${provider.slug}`} role="listitem" aria-label={`Browse ${provider.shortName}`} className={`group relative flex h-28 min-w-44 snap-start flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 px-5 transition duration-300 motion-reduce:transition-none hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:min-w-52 ${providerSurfaceClasses[provider.accent]} ${providerAccentClasses[provider.accent]}`}>
            <span className="absolute inset-0 bg-gradient-to-br from-white/[.08] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
            <Image src={providerLogo(provider.logo_path, 'w154')} alt={`${provider.shortName} logo`} width={154} height={52} className="relative max-h-11 w-auto max-w-[84%] object-contain opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100" />
            <span className="relative mt-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35 transition group-hover:text-white/65">{provider.shortName}</span>
            <ArrowUpRight className="absolute right-3 top-3 size-4 text-white/0 transition group-hover:text-white/70" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
