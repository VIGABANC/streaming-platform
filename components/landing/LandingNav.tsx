'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import gsap from 'gsap'
import { Menu, Search, X } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

const links = [
  { href: '/', label: 'Home' }, { href: '/browse', label: 'Discover' }, { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Shows' }, { href: '/search', label: 'Search' }, { href: '/my-list', label: 'Watchlist' },
]

export function LandingNav() {
  const root = useRef<HTMLElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        toggle.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      if (!menu.current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(menu.current, { autoAlpha: menuOpen ? 1 : 0, y: menuOpen ? 0 : -12 })
        return
      }
      gsap.to(menu.current, { autoAlpha: menuOpen ? 1 : 0, y: menuOpen ? 0 : -12, duration: 0.2, ease: 'power2.out', overwrite: true })
    }, root)
    return () => context.revert()
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)
  const linkClass = 'rounded px-2 py-2 text-sm font-medium text-white/80 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'

  return <header ref={root} className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${scrolled ? 'border-white/10 bg-[#050507]/90 shadow-xl backdrop-blur-xl' : 'border-transparent bg-transparent'}`}>
    <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-6 lg:px-12">
      <Logo />
      <nav aria-label="Main navigation" className="hidden items-center gap-4 md:flex">
        {links.map((link) => <Link key={link.href} href={link.href} className={linkClass}>{link.label}</Link>)}
        <Link href="/browse" className="ml-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Explore VEYRA</Link>
      </nav>
      <button ref={toggle} type="button" className="touch-target rounded text-white md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls="landing-mobile-menu">{menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
    </div>
    <div ref={menu} id="landing-mobile-menu" className={`pointer-events-none absolute inset-x-0 top-full border-b border-white/10 bg-[#050507]/95 px-5 py-5 backdrop-blur-xl md:hidden ${menuOpen ? 'opacity-100' : 'opacity-0'}`} aria-hidden={!menuOpen}>
      <nav aria-label="Main navigation" className={`flex flex-col gap-1 ${menuOpen ? 'pointer-events-auto' : ''}`}>
        {links.map((link) => <Link key={link.href} tabIndex={menuOpen ? 0 : -1} href={link.href} className="rounded px-3 py-3 text-lg font-medium text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={closeMenu}>{link.label === 'Search' ? <><Search className="mr-2 inline size-4" aria-hidden="true" />{link.label}</> : link.label}</Link>)}
        <Link tabIndex={menuOpen ? 0 : -1} href="/browse" className="mt-3 rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" onClick={closeMenu}>Explore VEYRA</Link>
      </nav>
    </div>
  </header>
}
