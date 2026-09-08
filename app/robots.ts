import type { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/config'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicSiteUrl()

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/watch/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
