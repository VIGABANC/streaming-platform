import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://veyra.stream'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/watch/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
