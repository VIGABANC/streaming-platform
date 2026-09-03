'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Film, Tv, Search, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/movies', label: 'Movies', icon: Film },
  { href: '/tv', label: 'Series', icon: Tv },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/profile', label: 'My VEYRA', icon: User },
] as const

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-white/8 bg-[#050507]/95 backdrop-blur-xl md:hidden safe-area-inset-bottom"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            aria-label={label}
            className={`touch-target relative flex min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition-colors ${
              active ? 'text-primary' : 'text-muted-foreground hover:text-white'
            }`}
          >
            {active && (
              <div className="absolute top-0 h-[2px] w-8 rounded-b-full bg-cyan cyan-glow shadow-[0_0_8px_rgba(0,242,254,0.6)]" />
            )}
            <Icon
              size={20}
              className={`transition-transform duration-200 ${active ? 'scale-110 text-primary' : ''}`}
              strokeWidth={active ? 2.5 : 1.75}
            />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
