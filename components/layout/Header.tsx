'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Search,
  X,
  Bookmark,
  User,
  Heart,
  History,
  Settings,
  ChevronDown,
  Flame,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { warmPlayerConnection } from '@/lib/player'

interface NavLinkItem {
  href: string
  label: string
  badge?: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

const NAV_LINKS: NavLinkItem[] = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Shows' },
  { href: '/new', label: 'New', badge: 'Fresh' },
  { href: '/top10', label: 'Top 10', icon: Flame },
  { href: '/discover', label: 'Discover' },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Track scroll for header bg
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keyboard shortcut: / to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setProfileOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Autofocus input when search opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    if (profileOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (!q) return
      setSearchOpen(false)
      setQuery('')
      router.push(`/search?q=${encodeURIComponent(q)}`)
      warmPlayerConnection()
    },
    [query, router],
  )

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/8 bg-[#050507]/90 backdrop-blur-xl shadow-lg shadow-black/40'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex ml-4">
          {NAV_LINKS.map(({ href, label, badge, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'text-white bg-white/8 font-semibold'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {Icon && <Icon size={14} className="text-amber-400" />}
              <span>{label}</span>
              {badge && (
                <span className="rounded bg-primary/20 border border-primary/40 px-1 py-0.2 text-[9px] font-extrabold uppercase tracking-tight text-primary">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className={`flex items-center overflow-hidden rounded-full border bg-white/5 transition-all duration-300 ${
              searchOpen
                ? 'w-48 sm:w-72 border-primary/40 bg-white/8'
                : 'w-0 border-transparent opacity-0 pointer-events-none'
            }`}
          >
            <Search size={15} className="ml-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, actors, genres…"
              aria-label="Search titles, actors, genres"
              maxLength={200}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm text-white outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="mr-1.5 grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </form>

          {/* Search toggle */}
          <button
            type="button"
            aria-label={searchOpen ? 'Close search' : 'Open search (/)'}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-white transition-colors"
          >
            {searchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* My Watchlist shortcut */}
          <Link
            href="/my-list"
            aria-label="Watchlist"
            title="Watchlist"
            className="hidden sm:grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-white transition-colors"
          >
            <Bookmark size={18} />
          </Link>

          {/* Favorites shortcut */}
          <Link
            href="/favorites"
            aria-label="Favorites"
            title="Favorites"
            className="hidden sm:grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-rose-400 transition-colors"
          >
            <Heart size={18} />
          </Link>

          {/* Glassmorphic Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              aria-label="User Profile & Settings"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 p-1.5 sm:px-2.5 sm:py-1.5 text-white/80 hover:border-primary/50 hover:bg-white/10 hover:text-white transition-all focus:outline-none"
            >
              <div className="relative grid size-7 place-items-center rounded-full bg-gradient-to-tr from-primary to-cyan text-white shadow-sm">
                <User size={14} />
              </div>
              <ChevronDown
                size={13}
                className={`hidden sm:block text-white/50 transition-transform duration-200 ${
                  profileOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {profileOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0A0D14]/95 p-1.5 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200"
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 25px rgba(229,9,20,0.15)' }}
              >
                <div className="px-3 py-2 border-b border-white/8">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    My Account
                  </p>
                  <p className="text-xs font-semibold text-white truncate">The Night Signal</p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/8 hover:text-white transition-colors"
                  >
                    <User size={15} className="text-cyan" />
                    <span>My Profile & Stats</span>
                  </Link>

                  <Link
                    href="/favorites"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/8 hover:text-white transition-colors"
                  >
                    <Heart size={15} className="text-rose-500" />
                    <span>Favorites</span>
                  </Link>

                  <Link
                    href="/my-list"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/8 hover:text-white transition-colors"
                  >
                    <Bookmark size={15} className="text-primary" />
                    <span>Watchlist</span>
                  </Link>

                  <Link
                    href="/history"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/90 hover:bg-white/8 hover:text-white transition-colors"
                  >
                    <History size={15} className="text-emerald-400" />
                    <span>Watch History</span>
                  </Link>
                </div>

                <div className="border-t border-white/8 pt-1">
                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/8 hover:text-white transition-colors"
                  >
                    <Settings size={15} />
                    <span>App Settings</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
