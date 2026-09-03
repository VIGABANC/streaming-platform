'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Play } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export function EpisodeShowcase() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.ep-header',
        { y: 30, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 75%'
          }
        }
      )

      gsap.fromTo('.ep-card',
        { x: 30, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out',
          scrollTrigger: {
            trigger: '.ep-list',
            start: 'top 80%'
          }
        }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="py-24 relative z-20 bg-[#050507]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 flex flex-col lg:flex-row gap-16">
        
        <div className="flex-1 ep-header lg:sticky lg:top-32 self-start">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Every season.<br/>Every episode.
          </h2>
          <p className="text-xl text-white/60 mb-8 max-w-md">
            Seamlessly navigate through years of television. Deep dive into episode descriptions, runtimes, and original air dates.
          </p>
          
          <div className="inline-flex bg-white/5 border border-white/10 rounded-lg p-1">
            {['Season 1', 'Season 2', 'Season 3'].map((s, i) => (
              <div key={i} className={`px-4 py-2 rounded-md text-sm font-medium cursor-pointer ${i === 1 ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white transition-colors'}`}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 ep-list space-y-4">
          {[1, 2, 3, 4, 5].map((ep) => (
            <div key={ep} className="ep-card group flex gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer">
              <div className="relative w-32 md:w-48 aspect-video bg-white/10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={14} className="text-white ml-0.5" />
                </div>
              </div>
              <div className="flex-1 py-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="text-white font-bold">Episode {ep}</h4>
                  <span className="text-xs font-mono text-white/40">45m</span>
                </div>
                <div className="text-xs text-white/50 mb-2">Oct {10 + ep}, 2023</div>
                <div className="w-full h-3 bg-white/5 rounded mt-auto" />
                <div className="w-2/3 h-3 bg-white/5 rounded mt-2" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
