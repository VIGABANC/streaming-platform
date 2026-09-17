import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://veyra.stream'

  const staticRoutes = [
    '',
    '/landing',
    '/browse',
    '/movies',
    '/tv',
    '/anime',
    '/discover',
    '/world-cinema',
    '/new',
    '/top10',
    '/providers',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  const genreRoutes = ['movie', 'tv'].flatMap((type) => [28, 12, 16, 35, 18].map((id) => ({
    url: `${baseUrl}/genre/${type}/${id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  })))
  return [...staticRoutes, ...genreRoutes]
}
