import Image from 'next/image'
import Link from 'next/link'
import { mediaHref, usableMedia } from '@/components/landing/landing-types'
import { poster, titleOf, type Media } from '@/lib/tmdb'

interface DiscoveryCategory {
  label: string
  href: string
  items: Media[]
}

interface DiscoveryShowcaseProps {
  categories: DiscoveryCategory[]
}

export function DiscoveryShowcase({ categories }: DiscoveryShowcaseProps) {
  return <section data-testid="discovery-showcase" className="landing-section pb-24" aria-labelledby="discovery-heading">
    <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-12">
      <header className="mb-8 max-w-2xl"><p className="eyebrow">Discovery desk</p><h2 id="discovery-heading" className="section-title mt-2">Everything worth watching.<br /><span className="text-amber-400">One signal away.</span></h2></header>
      <div className="grid gap-5 md:grid-cols-2" role="list">{categories.map((category) => <CategoryStory key={category.label} category={category} />)}</div>
    </div>
  </section>
}

function CategoryStory({ category }: { category: DiscoveryCategory }) {
  const items = usableMedia(category.items, 3)

  return <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]" role="listitem">
    <div className="flex items-center justify-between gap-4 px-5 pb-4 pt-5">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">Category signal</p><h3 className="mt-1 text-xl font-semibold text-white"><Link href={category.href} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">{category.label}</Link></h3></div>
      <Link href={category.href} className="text-sm text-white/65 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">Explore<span className="sr-only"> {category.label}</span><span aria-hidden="true"> →</span></Link>
    </div>
    {items.length ? <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)] gap-2 px-2 pb-2"><ArtworkLink item={items[0]} featured /><div className="grid gap-2">{items.slice(1).map((item) => <ArtworkLink key={`${item.media_type ?? 'movie'}-${item.id}`} item={item} />)}</div></div> : <p className="px-5 pb-6 text-sm leading-6 text-white/60">This category is temporarily unavailable. Explore the wider signal while we reconnect.</p>}
  </article>
}

function ArtworkLink({ item, featured = false }: { item: Media; featured?: boolean }) {
  return <Link href={mediaHref(item)} aria-label={`${titleOf(item)} — view details`} className={`group relative block overflow-hidden rounded-lg bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 ${featured ? 'aspect-[4/5]' : 'aspect-[2/1]'}`}>
    <Image src={poster(item.poster_path, featured ? 'w500' : 'w342')} alt={`${titleOf(item)} poster`} fill sizes={featured ? '(max-width: 768px) 55vw, 360px' : '(max-width: 768px) 35vw, 240px'} className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100" />
    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{titleOf(item)}</span>
  </Link>
}
