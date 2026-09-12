import type { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicSiteUrl()

  const staticRoutes = [
    '',
    '/landing',
    '/browse',
    '/movies',
    '/tv',
    '/anime',
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
