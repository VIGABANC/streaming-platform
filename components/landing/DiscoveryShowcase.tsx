'use client'

import { useLayoutEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { poster } from '@/lib/tmdb'
import type { Media } from '@/lib/tmdb'

gsap.registerPlugin(ScrollTrigger)

interface DiscoveryShowcaseProps {
  movies: Media[]
  tv: Media[]
}

export function DiscoveryShowcase({ movies, tv }: DiscoveryShowcaseProps) {
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

  // Create artwork slices for the cards
  const popMovies = movies.slice(0, 4)
  const popTv = tv.slice(0, 4)
  const topMovies = movies.slice(4, 8)
  const topTv = tv.slice(4, 8)

  const categories = [
    { title: 'Popular Movies', desc: 'The most watched stories this week', items: popMovies, href: '/movies' },
    { title: 'Popular TV', desc: 'The shows everyone is talking about', items: popTv, href: '/tv' },
    { title: 'Top Rated', desc: 'Critically acclaimed cinematic masterpieces', items: topMovies, href: '/movies' },
    { title: 'Now Playing', desc: 'Currently in theaters worldwide', items: topTv, href: '/tv' }
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
            <Link href={cat.href} key={i} className="discover-card relative h-[380px] p-6 rounded-2xl bg-[#0A0D14] border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1 group overflow-hidden flex flex-col justify-end" role="listitem">
              
              {/* Mosaic Background */}
              <div className="absolute inset-0 z-0 p-4 opacity-50 group-hover:opacity-80 transition-opacity duration-500">
                <div className="grid grid-cols-2 gap-2 h-[200px]">
                  {cat.items.map((item, j) => (
                    <div 
                      key={item.id} 
                      className="relative rounded-md overflow-hidden bg-white/5 transform transition-transform duration-700"
                      style={{ 
                        transform: `translateY(${j % 2 === 0 ? '-10px' : '10px'}) scale(${1 + (j * 0.02)})`,
                      }}
                    >
                      {item.poster_path && (
                        <Image
                          src={poster(item.poster_path, 'w500')}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          sizes="150px"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gradient mask */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/90 to-[#0A0D14]/10 z-10" />
              
              <div className="relative z-20">
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white mb-4 group-hover:bg-amber-500 group-hover:border-amber-400 group-hover:text-black transition-colors">
                  <span className="font-bold text-sm">0{i+1}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">{cat.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
