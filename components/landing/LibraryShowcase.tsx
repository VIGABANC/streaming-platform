'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function LibraryShowcase() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.lib-header',
        { y: 30, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 75%'
          }
        }
      )

      gsap.fromTo('.lib-progress',
        { width: '0%' },
        {
          width: '65%', duration: 1.5, ease: 'power2.out',
          scrollTrigger: {
            trigger: '.lib-card',
            start: 'top 80%'
          }
        }
      )
      
      gsap.fromTo('.lib-card',
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power2.out',
          scrollTrigger: {
            trigger: '.lib-grid',
            start: 'top 80%'
          }
        }
      )

    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="py-24 relative z-20 bg-[#050507]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 text-center">
        
        <div className="lib-header mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your night, remembered.
          </h2>
          <p className="text-xl text-white/60">
            Pick up exactly where you left off. Build your watchlist. Save your favorites. VEYRA remembers your journey across every tab.
          </p>
        </div>

        <div className="lib-grid grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="lib-card p-6 rounded-2xl bg-white/5 border border-white/10 text-left">
            <h3 className="text-lg font-bold text-white mb-4">Continue Watching</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-16 h-24 bg-white/10 rounded flex-shrink-0" />
                <div className="flex-1 py-2">
                  <div className="w-3/4 h-4 bg-white/20 rounded mb-4" />
                  <div className="w-full h-1 bg-white/10 rounded overflow-hidden">
                    <div className="lib-progress h-full bg-primary rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lib-card p-6 rounded-2xl bg-white/5 border border-white/10 text-left">
            <h3 className="text-lg font-bold text-white mb-4">Watchlist</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-[2/3] bg-white/10 rounded" />
              ))}
            </div>
          </div>
          
          <div className="lib-card p-6 rounded-2xl bg-white/5 border border-white/10 text-left">
            <h3 className="text-lg font-bold text-white mb-4">Favorites</h3>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-video bg-white/10 rounded" />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
