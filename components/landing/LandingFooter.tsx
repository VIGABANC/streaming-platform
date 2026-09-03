'use client'

import { useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import gsap from 'gsap'

export function LandingFooter() {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.footer-content',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power2.out' }
      )
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <footer ref={root} className="py-16 bg-[#050507] border-t border-white/5">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="footer-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white font-display">VEYRA</h3>
            <p className="text-white/60 text-sm leading-relaxed">
              The Night Signal. Your cinematic guide to movies and television worth watching.
            </p>
          </div>

          {/* Discover */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Discover</h4>
            <ul className="space-y-3">
              <li><Link href="/browse" className="text-white/60 hover:text-white text-sm transition-colors">Home</Link></li>
              <li><Link href="/movies" className="text-white/60 hover:text-white text-sm transition-colors">Movies</Link></li>
              <li><Link href="/tv" className="text-white/60 hover:text-white text-sm transition-colors">TV Shows</Link></li>
              <li><Link href="/search" className="text-white/60 hover:text-white text-sm transition-colors">Search</Link></li>
              <li><Link href="/my-list" className="text-white/60 hover:text-white text-sm transition-colors">Watchlist</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><span className="text-white/40 text-sm">Privacy Policy</span></li>
              <li><span className="text-white/40 text-sm">Terms of Service</span></li>
            </ul>
          </div>

          {/* Attribution */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Attribution</h4>
            <p className="text-white/40 text-xs leading-relaxed">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
            <p className="text-white/40 text-xs leading-relaxed">
              VEYRA does not host or store video media. Playback availability may rely on third-party providers.
            </p>
          </div>

        </div>

        <div className="footer-content pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} VEYRA. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Built for the night.
          </p>
        </div>
      </div>
    </footer>
  )
}
