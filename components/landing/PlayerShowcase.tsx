'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function PlayerShowcase() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 60%',
        }
      })

      tl.fromTo('.player-header',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      )
      .fromTo('.player-frame',
        { scale: 0.95, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' },
        "-=0.6"
      )
      .fromTo('.player-glow',
        { opacity: 0 },
        { opacity: 1, duration: 2, ease: 'power2.inOut' },
        "-=0.5"
      )

    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="py-32 relative z-20 bg-[#050507]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 text-center">
        
        <div className="player-header mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            From discovery to play.
          </h2>
          <p className="text-xl text-white/60">
            A seamless bridge to your content. VEYRA provides a resilient cinematic viewing frame with smart fallback recovery.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="player-glow absolute inset-0 bg-cyan-500/20 blur-[100px] pointer-events-none rounded-full transform scale-90" />
          
          <div className="player-frame relative aspect-video bg-[#0A0D14] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-end p-6 lg:p-10">
            {/* Fake player UI */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="relative z-10 w-full">
              <div className="w-full h-1.5 bg-white/20 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-primary w-1/3 rounded-full" />
              </div>
              <div className="flex justify-between items-center text-white">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-black border-b-[6px] border-b-transparent ml-1" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm">The Night Signal</span>
                    <span className="text-xs text-white/60">00:45:12 / 02:16:00</span>
                  </div>
                </div>
                <div className="flex gap-4 opacity-70">
                  <div className="w-6 h-6 bg-white/20 rounded" />
                  <div className="w-6 h-6 bg-white/20 rounded" />
                  <div className="w-6 h-6 bg-white/20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
