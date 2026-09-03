'use client'

import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Monitor, Smartphone, Tablet } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export function DeviceShowcase() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 70%',
        }
      })

      tl.fromTo('.device-header',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
      )
      .fromTo('.device-card',
        { y: 40, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.15, ease: 'power2.out' },
        "-=0.5"
      )

    }, root)
    return () => ctx.revert()
  }, [])

  const features = [
    {
      icon: Monitor,
      title: 'Desktop',
      desc: 'Cinematic 16:9 viewing with keyboard shortcuts and full-screen immersion.'
    },
    {
      icon: Tablet,
      title: 'Tablet',
      desc: 'Touch-optimized interface with horizontal rails and gesture navigation.'
    },
    {
      icon: Smartphone,
      title: 'Mobile',
      desc: 'Pocket-sized discovery with PWA installation and offline capability.'
    }
  ]

  return (
    <section ref={root} className="py-32 relative z-20 bg-[#050507]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 text-center">
        
        <div className="device-header mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Cinema follows you.
          </h2>
          <p className="text-xl text-white/60">
            VEYRA adapts to every screen. Install as a PWA. Navigate with keyboard. 
            Pick up where you left off across devices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <div key={i} className="device-card p-8 rounded-2xl bg-gradient-to-b from-white/5 to-white/[0.02] border border-white/10 hover:border-white/20 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto group-hover:bg-white/10 transition-colors">
                <feature.icon className="w-8 h-8 text-white/80" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
