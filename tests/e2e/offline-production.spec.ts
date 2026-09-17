import { test, expect } from '@playwright/test'

test.describe('production offline navigation', () => {
  test.use({ serviceWorkers: 'allow' })
  test('uses the offline fallback without fabricated catalog or playback', async ({ page, context }) => {
    await page.goto('/offline')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
      if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
    })
    await page.evaluate(() => localStorage.setItem('veyra-watchlist', JSON.stringify([{ id: 1, title: 'Saved offline', media_type: 'movie', addedAt: 1 }])))
    await context.setOffline(true)
    for (const path of ['/movies', '/my-list', '/watch/movie/1']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'You are offline' })).toBeVisible()
      await expect(page.locator('iframe')).toHaveCount(0)
    }
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('veyra-watchlist')!)[0].title)).toBe('Saved offline')
    const cached = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key => (await (await caches.open(key)).keys()).map(r => new URL(r.url).pathname)))).flat())
    expect(cached.some(path => path.startsWith('/watch/') || path === '/my-list' || path.startsWith('/api/'))).toBe(false)
    await context.setOffline(false)
    await page.goto('/my-list')
    await expect(page.getByRole('main')).toContainText('Saved offline')
  })
})
