import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { providerLogo, type WatchProvider } from '@/lib/tmdb'

const curated = ['Netflix', 'Disney Plus', 'Amazon Prime Video', 'Max', 'Apple TV Plus', 'Hulu', 'Paramount Plus', 'Peacock', 'Crunchyroll']
const slug = (name: string) => name.toLowerCase().replace(/\+/g, 'plus').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function ProviderRail({ providers }: { providers: WatchProvider[] }) {
  const items = curated.map((wanted) => providers.find((provider) => provider.provider_name.toLowerCase() === wanted.toLowerCase() || provider.provider_name.toLowerCase().includes(wanted.toLowerCase()))).filter(Boolean) as WatchProvider[]
  if (!items.length) return null
  return <section aria-labelledby="platforms-heading" className="space-y-5 px-4 py-10 sm:px-6 lg:px-10"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-400">The signal map</p><h2 id="platforms-heading" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Browse by platform</h2><p className="mt-1 text-sm text-white/45">Jump straight into the services you know.</p></div><Link href="/providers" className="hidden items-center gap-1 text-sm font-medium text-white/55 transition hover:text-white sm:flex">View all <ArrowUpRight className="size-4" /></Link></div><div className="flex snap-x gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map((provider) => <Link key={provider.provider_id} href={`/provider/${slug(provider.provider_name)}`} aria-label={`Browse ${provider.provider_name}`} className="group relative flex h-28 min-w-40 snap-start items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[.045] px-5 transition duration-300 hover:-translate-y-1 hover:border-red-400/50 hover:bg-white/[.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:min-w-48"><span className="absolute inset-0 bg-gradient-to-br from-white/[.06] to-transparent opacity-0 transition group-hover:opacity-100" /><Image src={providerLogo(provider.logo_path, 'w154')} alt={`${provider.provider_name} logo`} width={154} height={52} className="relative max-h-12 w-auto max-w-[85%] object-contain opacity-80 transition group-hover:scale-105 group-hover:opacity-100" /><ArrowUpRight className="absolute right-3 top-3 size-4 text-white/0 transition group-hover:text-white/70" /></Link>)}</div></section>
}
