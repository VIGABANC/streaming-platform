import type { WatchProvider } from '@/lib/tmdb'

export type ProviderAccent = 'netflix' | 'prime' | 'disney' | 'apple' | 'max' | 'hulu' | 'paramount' | 'peacock' | 'crunchyroll' | 'mubi' | 'default'

export type CuratedProvider = WatchProvider & { slug: string; accent: ProviderAccent; shortName: string }

const definitions = [
  { names: ['Netflix'], slug: 'netflix', accent: 'netflix', shortName: 'Netflix' },
  { names: ['Amazon Prime Video', 'Prime Video'], slug: 'prime-video', accent: 'prime', shortName: 'Prime Video' },
  { names: ['Disney Plus', 'Disney+'], slug: 'disney-plus', accent: 'disney', shortName: 'Disney+' },
  { names: ['Apple TV Plus', 'Apple TV+'], slug: 'apple-tv-plus', accent: 'apple', shortName: 'Apple TV+' },
  { names: ['Max', 'HBO Max'], slug: 'max', accent: 'max', shortName: 'Max' },
  { names: ['Hulu'], slug: 'hulu', accent: 'hulu', shortName: 'Hulu' },
  { names: ['Paramount Plus', 'Paramount+'], slug: 'paramount-plus', accent: 'paramount', shortName: 'Paramount+' },
  { names: ['Peacock'], slug: 'peacock', accent: 'peacock', shortName: 'Peacock' },
  { names: ['Crunchyroll'], slug: 'crunchyroll', accent: 'crunchyroll', shortName: 'Crunchyroll' },
  { names: ['MUBI'], slug: 'mubi', accent: 'mubi', shortName: 'MUBI' },
] as const

const normalize = (value: string) => value.toLowerCase().replace(/[+&]/g, ' plus ').replace(/[^a-z0-9]+/g, ' ').trim()

export function curateProviders(providers: WatchProvider[]): CuratedProvider[] {
  return definitions.flatMap((definition) => {
    const provider = providers.find((candidate) => definition.names.some((name) => normalize(candidate.provider_name) === normalize(name)))
    return provider ? [{ ...provider, slug: definition.slug, accent: definition.accent, shortName: definition.shortName }] : []
  })
}

export function getProviderDefinition(slug: string) {
  return definitions.find((definition) => definition.slug === slug)
}

export function providerSlug(name: string) {
  return curateProviders([{ provider_id: 0, provider_name: name }])[0]?.slug ?? normalize(name).replace(/ /g, '-')
}

export const providerAccentClasses: Record<ProviderAccent, string> = {
  netflix: 'hover:border-red-500/60 hover:shadow-[0_18px_50px_-28px_rgba(229,9,20,.9)]',
  prime: 'hover:border-sky-400/60 hover:shadow-[0_18px_50px_-28px_rgba(56,189,248,.8)]',
  disney: 'hover:border-blue-400/60 hover:shadow-[0_18px_50px_-28px_rgba(96,165,250,.8)]',
  apple: 'hover:border-slate-200/50 hover:shadow-[0_18px_50px_-28px_rgba(226,232,240,.7)]',
  max: 'hover:border-violet-400/60 hover:shadow-[0_18px_50px_-28px_rgba(167,139,250,.8)]',
  hulu: 'hover:border-lime-400/60 hover:shadow-[0_18px_50px_-28px_rgba(163,230,53,.75)]',
  paramount: 'hover:border-indigo-400/60 hover:shadow-[0_18px_50px_-28px_rgba(129,140,248,.8)]',
  peacock: 'hover:border-orange-300/60 hover:shadow-[0_18px_50px_-28px_rgba(253,186,116,.8)]',
  crunchyroll: 'hover:border-orange-400/60 hover:shadow-[0_18px_50px_-28px_rgba(251,146,60,.8)]',
  mubi: 'hover:border-yellow-300/60 hover:shadow-[0_18px_50px_-28px_rgba(253,224,71,.75)]',
  default: 'hover:border-white/40 hover:shadow-[0_18px_50px_-28px_rgba(255,255,255,.4)]',
}

export const providerSurfaceClasses: Record<ProviderAccent, string> = {
  netflix: 'bg-red-950/[.18]', prime: 'bg-sky-950/[.18]', disney: 'bg-blue-950/[.2]', apple: 'bg-slate-900/[.3]', max: 'bg-violet-950/[.18]', hulu: 'bg-lime-950/[.12]', paramount: 'bg-indigo-950/[.18]', peacock: 'bg-orange-950/[.12]', crunchyroll: 'bg-orange-950/[.16]', mubi: 'bg-yellow-950/[.14]', default: 'bg-white/[.04]',
}
