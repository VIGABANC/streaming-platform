'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, X, Bookmark, ChevronDown } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { warmPlayerConnection } from '@/lib/player'

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Shows' },
  { href: '/discover', label: 'Discover' },
] as const

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const moreRef = useRef<HTMLDivElement>(null)

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
        setMoreOpen(false)
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

  // Close "more" dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [moreOpen])

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (!q) return
      setSearchOpen(false)
      setQuery('')
      router.push(`/search?q=${encodeURIComponent(q)}`)
      // Warm player connection proactively
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
          ? 'border-white/8 bg-[#0B0C18]/90 backdrop-blur-xl shadow-lg shadow-black/20'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex ml-4">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(href)
                  ? 'text-white bg-white/8'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
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
              placeholder="Search titles…"
              aria-label="Search titles"
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

          {/* My List */}
          <Link
            href="/my-list"
            aria-label="My List"
            className="hidden sm:grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-white transition-colors"
          >
            <Bookmark size={18} />
          </Link>

          {/* More dropdown */}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              aria-label="More options"
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              onClick={() => setMoreOpen((v) => !v)}
              className="hidden md:grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-white transition-colors"
            >
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {moreOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 w-48 rounded-xl border border-white/10 bg-surface p-1.5 shadow-2xl"
              >
                <Link
                  href="/discover"
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/8"
                >
                  Discover titles
                </Link>
                <Link
                  href="/my-list"
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm text-white hover:bg-white/8"
                >
                  My watchlist
                </Link>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMoreOpen(false)
                    setSearchOpen(true)
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-white hover:bg-white/8"
                >
                  Search library
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
