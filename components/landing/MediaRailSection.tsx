'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { poster } from '@/lib/tmdb'
import type { Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface MediaRailSectionProps {
  trending: Media[]
}

export function MediaRailSection({ trending }: MediaRailSectionProps) {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.rail-card')
      
      gsap.fromTo('.rail-header',
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 80%',
          }
        }
      )

      gsap.fromTo(cards,
        { x: 50, opacity: 0, scale: 0.95 },
        {
          x: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: {
            trigger: '.rail-container',
            start: 'top 85%',
          }
        }
      )
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="py-24 relative z-20 bg-[#050507]" aria-labelledby="trending-heading">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="rail-header mb-8">
          <h2 id="trending-heading" className="text-3xl md:text-4xl font-bold text-white mb-2">Trending Tonight</h2>
          <p className="text-white/60 text-lg">Signals everyone is following right now.</p>
        </div>

        <div className="rail-container flex overflow-x-auto gap-4 pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:-mx-12 lg:px-12" role="list" aria-label="Trending movies and TV shows">
          {trending.slice(0, 10).map((item) => (
            <Link 
              key={item.id} 
              href={`/${item.media_type || 'movie'}/${item.id}`}
              className="rail-card relative flex-none w-[160px] md:w-[220px] aspect-[2/3] rounded-xl overflow-hidden group snap-start bg-white/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              role="listitem"
            >
              {item.poster_path ? (
                <Image
                  src={poster(item.poster_path, 'w500')}
                  alt={`${item.title || item.name} poster`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 160px, 220px"
                />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/50 text-sm p-4 text-center">
                  {item.title || item.name}
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white font-bold truncate">{item.title || item.name}</p>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-medium mt-1">
                  <span>{item.vote_average?.toFixed(1)}</span>
                  {item.release_date || item.first_air_date ? (
                    <span className="text-white/60">
                      {(item.release_date || item.first_air_date)?.split('-')[0]}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
