import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://veyra.stream'

  const staticRoutes = [
    '',
    '/landing',
    '/browse',
    '/movies',
    '/tv',
    '/discover',
    '/new',
    '/top10',
    '/providers',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  return staticRoutes
}
