import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('PWA assets and service worker policy', () => {
  it('declares installable raster icon sizes', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.json', 'utf8')) as { icons: { sizes: string }[] }
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
  })

  it('does not cache personal or player routes', () => {
    const serviceWorker = readFileSync('public/sw.js', 'utf8')
    expect(serviceWorker).toContain("url.pathname.startsWith('/api/')")
    expect(serviceWorker).toContain("url.pathname.startsWith('/watch/')")
    expect(serviceWorker).toContain("url.pathname.startsWith('/settings')")
    expect(serviceWorker).toContain("type === 'SKIP_WAITING'")
  })

  it('versions the app shell cache explicitly for stale-client recovery', () => {
    const serviceWorker = readFileSync('public/sw.js', 'utf8')
    expect(serviceWorker).toContain('SERVICE_WORKER_VERSION')
    expect(serviceWorker).toContain('BUILD_ID')
    expect(serviceWorker).toContain('veyra-shell-v${SERVICE_WORKER_VERSION}-${BUILD_ID}')
  })
})
