import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: '/search' },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
