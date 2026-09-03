'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function DetailShowcase() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 70%',
        }
      })

      tl.fromTo('.detail-bg',
        { scale: 1.1, opacity: 0 },
        { scale: 1, opacity: 0.4, duration: 1.5, ease: 'power3.out' }
      )
      .fromTo('.detail-content',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power2.out' },
        "-=1"
      )
      .fromTo('.detail-meta',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        "-=0.5"
      )

    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="py-32 relative z-20 bg-[#050507] overflow-hidden min-h-[80vh] flex items-center">
      
      <div className="detail-bg absolute inset-0 bg-gradient-to-b from-cyan-900/20 to-[#050507] pointer-events-none" />
      
      <div className="mx-auto w-full max-w-[1440px] px-6 lg:px-12 relative z-10 flex flex-col justify-end h-full">
        <div className="max-w-2xl detail-content">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Go beyond the poster.</h2>
          <p className="text-xl text-white/70 mb-8 leading-relaxed">
            Immerse yourself in the details. Cast, trailers, recommendations, and deep production metadata. Everything you need to decide if it's the right signal for tonight.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-8">
            {['Action', 'Sci-Fi', 'Thriller', '1999', '2h 16m', '★ 8.7'].map((tag, i) => (
              <span key={i} className="detail-meta px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            <div className="detail-meta w-32 h-10 bg-white rounded-full flex items-center justify-center font-bold text-black text-sm">Watch Trailer</div>
            <div className="detail-meta w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <div className="w-4 h-4 bg-white/60" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
