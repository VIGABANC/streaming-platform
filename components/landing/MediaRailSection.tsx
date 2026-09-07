'use client'

import { useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MediaPosterCard } from '@/components/landing/MediaPosterCard'
import { usableMedia } from '@/components/landing/landing-types'
import type { Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface MediaRailSectionProps {
  id: string
  title: string
  subtitle?: string
  items: Media[]
  href?: string
}

export function MediaRailSection({ id, title, subtitle, items, href }: MediaRailSectionProps) {
  const root = useRef<HTMLElement>(null)
  const cards = usableMedia(items, 10)
  const headingId = `${id}-heading`

  useLayoutEffect(() => {
    if (!root.current) return

    const context = gsap.context(() => {
      const targets = root.current?.querySelectorAll<HTMLElement>('[data-rail-reveal]') ?? []
      const media = gsap.matchMedia()

      media.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(targets, { autoAlpha: 1, clearProps: 'transform' })
      })

      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 82%', once: true } })
          .fromTo('[data-rail-heading]', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' })
          .fromTo('[data-rail-card]', { autoAlpha: 0, y: 18, scale: 0.98 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: 'power2.out' }, '<0.08')
      })

      return () => media.revert()
    }, root)

    return () => context.revert()
  }, [cards.length])

  return <section id={id} ref={root} data-testid={`media-rail-${id}`} data-rail={id} className="landing-section" aria-labelledby={headingId}>
    <div className="signal-spine" aria-hidden="true" />
    <div className="mx-auto max-w-[1440px] px-5 sm:px-6 lg:px-12">
      <header data-rail-heading data-rail-reveal className="mb-7 flex items-end justify-between gap-5">
        <div className="max-w-2xl"><h2 id={headingId} className="section-title">{title}</h2>{subtitle ? <p className="mt-2 text-sm leading-6 text-white/60">{subtitle}</p> : null}</div>
        {href ? <Link href={href} className="shrink-0 text-sm font-semibold text-amber-300 transition-colors hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-300">Browse<span aria-hidden="true"> →</span></Link> : null}
      </header>
      {cards.length ? <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-4 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12" role="list" aria-label={title}>{cards.map((item) => <div key={`${item.media_type ?? 'movie'}-${item.id}`} data-rail-card data-rail-reveal className="shrink-0" role="listitem"><MediaPosterCard item={item} /></div>)}</div> : <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/60">The signal is quiet for now. Check back shortly.</p>}
    </div>
  </section>
}
