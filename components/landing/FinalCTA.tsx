'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { backdrop } from '@/lib/tmdb'
import type { Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface FinalCTAProps {
  trending?: Media[]
}

export function FinalCTA({ trending }: FinalCTAProps) {
  const root = useRef<HTMLElement>(null)
  
  // Use a different backdrop from hero
  const ctaItem = trending?.find(t => t.backdrop_path && t.id !== trending[0]?.id) || trending?.[1]

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    
    mm.add({
      reduceMotion: "(prefers-reduced-motion: reduce)",
      desktop: "(min-width: 1024px)",
      mobile: "(max-width: 1023px)",
    }, (context) => {
      const { reduceMotion } = context.conditions ?? {}

      if (reduceMotion) {
        gsap.set(root.current, { clearProps: "all" })
        return
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: 'top 70%',
      }
      })

      tl.fromTo('.cta-bg',
        { scale: 1.1, opacity: 0 },
        { scale: 1, opacity: 0.3, duration: 1.5, ease: 'power3.out' }
      )
      .fromTo('.cta-content',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power2.out' },
        "-=1"
      )
      .fromTo('.cta-btn',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        "-=0.5"
      )
    })

    return () => mm.revert()
  }, [])

  return (
    <section ref={root} className="relative py-32 z-20 overflow-hidden min-h-[70vh] flex items-center" aria-label="Final call to action">
      {/* Background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {ctaItem?.backdrop_path ? (
          <div className="cta-bg absolute inset-0 transform-gpu">
            <Image
              src={backdrop(ctaItem.backdrop_path, 'original')}
              alt=""
              fill
              className="object-cover"
              sizes="100vw"
              quality={85}
            />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-[#050507]/95 to-[#050507]/80" />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-12 text-center">
        <div className="cta-content max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            The next signal is already playing.
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Your story is waiting. Discover movies and television worth your time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link 
              href="/browse" 
              className="cta-btn px-10 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-white/90 transition-transform active:scale-95 shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050507] focus:ring-white"
            >
              Enter VEYRA
            </Link>
            <Link 
              href="/browse" 
              className="cta-btn px-10 py-4 rounded-full bg-white/10 text-white font-bold text-lg backdrop-blur-md hover:bg-white/20 transition-transform active:scale-95 border border-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050507] focus:ring-white"
            >
              Browse Trending
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
