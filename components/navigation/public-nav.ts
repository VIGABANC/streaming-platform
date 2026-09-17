export const PUBLIC_NAV_ITEMS = [
  { href: '/browse', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'Series' },
  { href: '/anime', label: 'Anime' },
  { href: '/new', label: 'New' },
  { href: '/top10', label: 'Top 10' },
  { href: '/discover', label: 'Discover' },
  { href: '/my-list', label: 'Watchlist' },
  { href: '/favorites', label: 'Favorites' },
  { href: '/history', label: 'History' },
] as const

export const ACCOUNT_NAV_ITEMS = [
  { href: '/profile', label: 'Profile' },
  { href: '/settings', label: 'Settings' },
] as const

export function isNavItemActive(pathname: string, href: string) {
  return href === '/browse' ? pathname === '/' || pathname === '/browse' : pathname === href || pathname.startsWith(`${href}/`)
}
