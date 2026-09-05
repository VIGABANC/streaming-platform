/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
  async headers() {
    const supabaseOrigin = (() => {
      try {
        const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!raw) return ''
        const parsed = new URL(raw)
        return parsed.protocol === 'https:' ? parsed.origin : ''
      } catch {
        return ''
      }
    })()
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' https://image.tmdb.org data: blob:",
      "media-src 'self' blob:",
      `connect-src 'self' https://api.themoviedb.org https://va.vercel-scripts.com https://vitals.vercel-insights.com${supabaseOrigin ? ` ${supabaseOrigin}` : ''}`,
      "frame-src 'self' https://v1.vidsrc.wiki https://vidsrc.xyz https://www.2embed.cc https://player.autoembed.cc https://www.youtube.com https://youtube.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
