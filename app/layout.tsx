import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'luma. — Find your next story', description: 'A cinematic guide to movies and series worth watching.', generator: 'luma.' }
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#07090e' }
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en" className="dark"><head><link rel="dns-prefetch" href="https://vidsrc.wiki"/><link rel="preconnect" href="https://vidsrc.wiki" crossOrigin="anonymous"/></head><body className="antialiased">{children}{process.env.NODE_ENV==='production'&&<Analytics/>}</body></html> }
