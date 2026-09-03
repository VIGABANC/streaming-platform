'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { Search } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export function LandingNav() {
  const root = useRef<HTMLElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useLayoutEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo('.nav-item', 
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
      )
    }, root)
    return () => context.revert()
  }, [])

  return (
    <header 
      ref={root} 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
        scrolled 
          ? 'bg-[#050507]/90 backdrop-blur-xl border-white/10 shadow-xl' 
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 lg:px-12">
        <div className="nav-item">
          <Logo />
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/browse" className="nav-item text-sm font-medium text-white/80 hover:text-white transition-colors">Discover</Link>
          <Link href="/movies" className="nav-item text-sm font-medium text-white/80 hover:text-white transition-colors">Movies</Link>
          <Link href="/tv" className="nav-item text-sm font-medium text-white/80 hover:text-white transition-colors">TV Shows</Link>
          <Link href="/streaming" className="nav-item text-sm font-medium text-white/80 hover:text-white transition-colors">Streaming</Link>
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/search" className="nav-item text-white/80 hover:text-white transition-colors" aria-label="Search">
            <Search size={20} />
          </Link>
          <Link href="/browse" className="nav-item px-6 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-white/90 transition-all">
            Explore VEYRA
          </Link>
        </div>

        {/* Mobile toggle */}
        <button 
          className="md:hidden text-white nav-item touch-target" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div 
          id="mobile-menu"
          className="absolute top-full left-0 right-0 bg-[#050507] border-b border-white/10 p-6 md:hidden"
          role="navigation"
          aria-label="Main navigation"
        >
          <nav className="flex flex-col gap-6">
            <Link 
              href="/browse" 
              className="text-xl font-medium text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white rounded"
              onClick={() => setMenuOpen(false)}
            >
              Discover
            </Link>
            <Link 
              href="/movies" 
              className="text-xl font-medium text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white rounded"
              onClick={() => setMenuOpen(false)}
            >
              Movies
            </Link>
            <Link 
              href="/tv" 
              className="text-xl font-medium text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white rounded"
              onClick={() => setMenuOpen(false)}
            >
              TV Shows
            </Link>
            <Link 
              href="/search" 
              className="text-xl font-medium text-white flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white rounded"
              onClick={() => setMenuOpen(false)}
            >
              <Search size={20} /> Search
            </Link>
            <Link 
              href="/browse" 
              className="mt-4 text-center px-6 py-3 rounded-full bg-white text-black font-bold focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setMenuOpen(false)}
            >
              Explore VEYRA
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
