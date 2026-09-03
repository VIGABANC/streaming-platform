'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { backdrop } from '@/lib/tmdb'
import type { Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface CinematicHeroProps {
  trending: Media[]
}

export function CinematicHero({ trending }: CinematicHeroProps) {
  const root = useRef<HTMLDivElement>(null)
  
  // Use first movie with a backdrop
  const heroItem = trending.find(t => t.backdrop_path) || trending[0]

  useLayoutEffect(() => {
    const mm = gsap.matchMedia()
    
    mm.add({
      reduceMotion: "(prefers-reduced-motion: reduce)",
      desktop: "(min-width: 1024px)",
      mobile: "(max-width: 1023px)",
    }, (context) => {
      const { reduceMotion, desktop } = context.conditions ?? {}

      if (reduceMotion) {
        gsap.set(root.current, { clearProps: "all" })
        return
      }

      // Timeline for entrance
      const tl = gsap.timeline()
      
      tl.fromTo('.hero-bg', 
        { scale: 1.08, filter: 'blur(10px)', opacity: 0 },
        { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 2, ease: 'power3.out' }
      )
      .fromTo('.hero-content > *',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power2.out' },
        "-=1.2"
      )

      if (desktop) {
        // Parallax scroll effect
        gsap.to('.hero-bg', {
          yPercent: 30,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        })
      }
    })

    return () => mm.revert()
  }, [])

  if (!heroItem) return null

  return (
    <section ref={root} className="relative h-screen w-full flex items-center overflow-hidden" aria-label="Hero section">
      {/* Background image & gradients */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <div className="hero-bg absolute inset-0 transform-gpu">
          <Image
            src={backdrop(heroItem.backdrop_path, 'original')}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
            quality={90}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#050507] via-[#050507]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 lg:px-12 pt-20">
        <div className="hero-content max-w-2xl">
          <p className="text-sm md:text-base font-bold tracking-[0.2em] text-amber-500 uppercase mb-4">
            The Night Signal
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-6 leading-[1.05]">
            Find the story worth staying up for.
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl font-medium leading-relaxed">
            Discover cinematic moments. VEYRA brings movies and television discovery into one elegant experience.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Link 
              href="/browse" 
              className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-white/90 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050507] focus:ring-white"
            >
              Start Exploring
            </Link>
            <Link 
              href="/browse" 
              className="px-8 py-4 rounded-full bg-white/10 text-white font-bold text-lg backdrop-blur-md hover:bg-white/20 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#050507] focus:ring-white"
            >
              Trending Tonight
            </Link>
          </div>
          
          <div className="mt-8 flex items-center gap-2 text-white/50 text-sm">
            <span className="px-2 py-1 rounded border border-white/20 bg-white/5 text-xs font-mono">/</span>
            <span>Press / to search</span>
          </div>
        </div>
      </div>
    </section>
  )
}
