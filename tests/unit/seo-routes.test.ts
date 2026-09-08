import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'

describe('SEO route policy', () => {
  it('includes public discovery routes and excludes private or query-driven routes', () => {
    const urls = sitemap().map((entry) => entry.url)

    expect(urls).toEqual(expect.arrayContaining([
      'https://streaming-platform-beryl.vercel.app',
      'https://streaming-platform-beryl.vercel.app/landing',
      'https://streaming-platform-beryl.vercel.app/browse',
      'https://streaming-platform-beryl.vercel.app/providers',
    ]))
    expect(urls).not.toContain('https://streaming-platform-beryl.vercel.app/my-list')
    expect(urls).not.toContain('https://streaming-platform-beryl.vercel.app/search')
  })

  it('does not claim a synthetic last-modified time', () => {
    expect(sitemap().every((entry) => !('lastModified' in entry))).toBe(true)
  })
})
