'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Search } from 'lucide-react'
import { poster, titleOf, yearOf } from '@/lib/tmdb'
import type { Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface SearchShowcaseProps {
  trending: Media[]
}

export function SearchShowcase({ trending }: SearchShowcaseProps) {
  const root = useRef<HTMLElement>(null)
  
  const results = trending.slice(0, 3)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 60%',
        }
      })

      tl.fromTo('.search-header', 
        { y: 30, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      )
      .fromTo('.search-ui',
        { scale: 0.95, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
        "-=0.4"
      )
      .fromTo('.search-result',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' },
        "-=0.2"
      )

    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="py-32 relative z-20 bg-[#050507]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16">
        
        <div className="flex-1 w-full lg:w-1/2 search-header">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Search less.<br/>
            Find faster.
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-lg">
            Universal search across movies and television. 
            Instant results. Deep filtering. Press <kbd className="px-2 py-1 bg-white/10 rounded text-sm font-mono mx-1">/</kbd> anytime to start.
          </p>
        </div>

        <div className="flex-1 w-full lg:w-1/2">
          <div className="search-ui bg-[#0A0D14] rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-4 bg-white/5 rounded-xl px-4 py-3 border border-white/10 mb-6 relative z-10">
              <Search className="text-white/40" />
              <div className="w-px h-5 bg-amber-500 animate-pulse" />
              <span className="text-white/20 text-sm absolute left-12 top-1/2 -translate-y-1/2">S</span>
            </div>

            <div className="space-y-4 relative z-10">
              <p className="text-xs font-bold text-white/40 uppercase tracking-wider">Top Results</p>
              {results.map((item) => (
                <div key={item.id} className="search-result flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                  <div className="w-12 h-16 bg-white/5 rounded overflow-hidden flex-shrink-0 relative">
                    {item.poster_path && (
                      <Image
                        src={poster(item.poster_path, 'w185')}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    )}
                  </div>
                  <div className="flex-col flex-1">
                    <div className="text-white font-bold text-sm truncate">{titleOf(item)}</div>
                    <div className="text-white/50 text-xs mt-1 flex items-center gap-2">
                      <span>{yearOf(item)}</span>
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="capitalize">{item.media_type || 'movie'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
