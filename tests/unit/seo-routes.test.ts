import { describe, expect, it } from 'vitest'
import sitemap from '@/app/sitemap'

describe('SEO route policy', () => {
  it('includes public discovery routes and excludes private or query-driven routes', () => {
    const urls = sitemap().map((entry) => entry.url)

    expect(urls).toEqual(expect.arrayContaining([
      'https://veyra.stream',
      'https://veyra.stream/landing',
      'https://veyra.stream/browse',
      'https://veyra.stream/providers',
    ]))
    expect(urls).not.toContain('https://veyra.stream/my-list')
    expect(urls).not.toContain('https://veyra.stream/search')
  })

  it('does not claim a synthetic last-modified time', () => {
    expect(sitemap().every((entry) => !('lastModified' in entry))).toBe(true)
  })
})
