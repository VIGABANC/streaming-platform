import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { getTopAnime } from '@/lib/jikan/client'

export const metadata: Metadata = {
  title: 'Anime', description: 'Discover popular anime. Playback is shown only when VEYRA has a verified provider.', alternates: { canonical: '/anime' },
}

export default async function AnimePage() {
  const anime = await getTopAnime()
  return <Shell><section className="px-5 py-10 lg:px-10"><div className="mx-auto max-w-[1440px]"><p className="eyebrow">Anime</p><h1 className="mt-2 text-4xl font-bold text-white">Discover anime</h1><p className="mt-3 max-w-2xl text-sm text-muted-foreground">Catalog data comes from Jikan. VEYRA does not offer anime playback until a provider is verified.</p>{anime.length ? <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{anime.map((item) => <li key={item.id}><Link href={`/anime/${item.id}`} className="block rounded-xl border border-white/10 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"><div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-surface">{item.image ? <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 20vw, 45vw" className="object-cover" /> : null}</div><h2 className="mt-3 font-semibold text-white">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.score ? `${item.score.toFixed(1)} community score` : 'Score unavailable'} · Playback unavailable</p></Link></li>)}</ul> : <p className="mt-8 rounded-xl border border-white/10 p-6 text-sm text-muted-foreground">Anime catalog is temporarily unavailable. Try again later.</p>}</div></section></Shell>
}
