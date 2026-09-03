'use client'

import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { Check, ChevronLeft, ChevronRight, Tv2 } from 'lucide-react'
import { providerLogo } from '@/lib/tmdb'
import type { WatchProvider } from '@/lib/tmdb'

const displayNames: Record<string, string> = {
  'Amazon Prime Video': 'Prime Video',
  'HBO Max': 'Max',
  'Apple TV': 'Apple TV+',
}

export function ProviderSwitcher({ providers, activeProviderId }: { providers: WatchProvider[]; activeProviderId?: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const visibleProviders = providers.filter((provider, index, all) => all.findIndex((item) => item.provider_id === provider.provider_id) === index).slice(0, 12)

  function selectProvider(providerId?: number) {
    const next = new URLSearchParams(searchParams.toString())
    if (providerId) next.set('provider', String(providerId))
    else next.delete('provider')
    const query = next.toString()
    startTransition(() => router.push(`${pathname}${query ? `?${query}` : ''}#streaming-providers`))
  }

  return (
    <section id="streaming-providers" className="relative z-20 -mt-10 scroll-mt-24 px-6 pb-16 lg:px-12" aria-labelledby="provider-heading">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-500">Choose your signal</p>
            <h2 id="provider-heading" className="mt-2 text-lg font-semibold text-white">Where are you watching tonight?</h2>
          </div>
          <span className="hidden font-mono text-xs text-white/40 md:block">{isPending ? 'Tuning signal…' : 'Availability varies by region'}</span>
        </div>
        <div className="group/rail relative">
          <button type="button" onClick={() => document.getElementById('provider-rail')?.scrollBy({ left: -320, behavior: 'smooth' })} className="absolute -left-5 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#101015]/95 text-white transition hover:border-white/30 md:flex" aria-label="Previous streaming providers"><ChevronLeft className="size-4" /></button>
          <div id="provider-rail" className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-hide" role="list" aria-label="Streaming providers">
            <button type="button" onClick={() => selectProvider()} aria-pressed={!activeProviderId} className={`flex h-[62px] min-w-[92px] snap-start items-center justify-center gap-2 rounded-sm border px-4 text-sm font-semibold transition duration-200 active:scale-[.98] ${!activeProviderId ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/10 bg-white/[.045] text-white/70 hover:border-white/30 hover:bg-white/[.09] hover:text-white'}`} role="listitem"><Check className={`size-4 ${!activeProviderId ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />All</button>
            {visibleProviders.map((provider) => {
              const active = provider.provider_id === activeProviderId
              return <button type="button" key={provider.provider_id} onClick={() => selectProvider(provider.provider_id)} aria-pressed={active} className={`flex h-[62px] min-w-[142px] snap-start items-center gap-3 rounded-sm border px-4 text-left transition duration-200 active:scale-[.98] ${active ? 'border-amber-500 bg-white/[.13] text-white shadow-[0_0_24px_rgba(245,158,11,.12)]' : 'border-white/10 bg-white/[.045] text-white/65 hover:border-white/30 hover:bg-white/[.09] hover:text-white'}`} role="listitem"><span className={`flex size-8 shrink-0 items-center justify-center rounded bg-white/90 p-1.5 ${active ? 'opacity-100' : 'opacity-75'}`}>{provider.logo_path ? <Image src={providerLogo(provider.logo_path)} alt="" width={32} height={32} className="max-h-6 w-auto object-contain" /> : <Tv2 className="size-4 text-black" />}</span><span className="line-clamp-2 text-xs font-semibold leading-tight">{displayNames[provider.provider_name] ?? provider.provider_name}</span>{active && <Check className="ml-auto size-4 shrink-0 text-amber-400" aria-hidden="true" />}</button>
            })}
          </div>
          <button type="button" onClick={() => document.getElementById('provider-rail')?.scrollBy({ left: 320, behavior: 'smooth' })} className="absolute -right-5 top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#101015]/95 text-white transition hover:border-white/30 md:flex" aria-label="Next streaming providers"><ChevronRight className="size-4" /></button>
        </div>
      </div>
    </section>
  )
}
