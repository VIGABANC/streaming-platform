import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

function getSitemapUrls(): string[] {
  const xml = readFileSync(join(process.cwd(), 'app', 'sitemap.xml'), 'utf-8')
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1])
}

describe('SEO route policy', () => {
  it('includes public discovery routes and excludes private or query-driven routes', () => {
    const urls = getSitemapUrls()

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
    const xml = readFileSync(join(process.cwd(), 'app', 'sitemap.xml'), 'utf-8')
    expect(xml).not.toContain('<lastmod>')
  })
})
