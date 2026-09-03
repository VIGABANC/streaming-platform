'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function DiscoveryShowcase() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.discover-title',
        { y: 30, opacity: 0 },
        { 
          y: 0, opacity: 1, duration: 1, ease: 'power3.out',
          scrollTrigger: {
            trigger: root.current,
            start: 'top 75%'
          }
        }
      )

      gsap.fromTo('.discover-card',
        { y: 50, opacity: 0, rotationY: 10 },
        {
          y: 0, opacity: 1, rotationY: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out',
          scrollTrigger: {
            trigger: '.discover-grid',
            start: 'top 80%'
          }
        }
      )
    }, root)

    return () => ctx.revert()
  }, [])

  const categories = [
    { title: 'Popular', desc: 'The most watched stories this week' },
    { title: 'Top Rated', desc: 'Critically acclaimed masterpieces' },
    { title: 'Now Playing', desc: 'Currently in theaters worldwide' },
    { title: 'Upcoming', desc: 'Highly anticipated releases' }
  ]

  return (
    <section ref={root} className="py-32 relative z-20 bg-[#050507]" aria-labelledby="discovery-heading">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="max-w-2xl mb-16">
          <h2 id="discovery-heading" className="discover-title text-4xl md:text-5xl font-bold text-white mb-6">
            Everything worth watching.<br/>
            <span className="text-amber-500">One signal away.</span>
          </h2>
        </div>

        <div className="discover-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
          {categories.map((cat, i) => (
            <div key={i} className="discover-card relative p-8 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-colors group" role="listitem">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
                <span className="text-6xl font-black">0{i+1}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 relative z-10">{cat.title}</h3>
              <p className="text-white/60 relative z-10">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
