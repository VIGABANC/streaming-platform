import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'VEYRA — Discover Movies & TV After Dark',
    template: '%s — VEYRA',
  },
  description:
    'VEYRA is your cinematic discovery layer for finding movies and television worth watching. The Night Signal brings trending, popular, and acclaimed content into one elegant experience.',
  keywords: ['movies', 'TV shows', 'streaming', 'discovery', 'cinema', 'VEYRA', 'The Night Signal', 'movie discovery', 'TV discovery'],
  authors: [{ name: 'VEYRA' }],
  creator: 'VEYRA',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'VEYRA',
    title: 'VEYRA — The Night Signal',
    description: 'Find the story worth staying up for. Cinematic movie and TV discovery with trending, popular, and acclaimed content.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VEYRA — The Night Signal',
    description: 'Find the story worth staying up for. Cinematic movie and TV discovery.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#050507',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Provider connection hints */}
        <link rel="dns-prefetch" href="https://v1.vidsrc.wiki" />
        <link rel="preconnect" href="https://v1.vidsrc.wiki" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://image.tmdb.org" crossOrigin="anonymous" />
        {/* Google Fonts — preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
        />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VEYRA" />
      </head>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
