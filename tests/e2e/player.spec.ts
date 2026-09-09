import { test, expect } from '@playwright/test'

test.describe('Player reliability shell', () => {
  test('fails over when the first provider request is aborted', async ({ page }) => {
    let aborted = false
    await page.route('https://v1.vidsrc.wiki/**', async (route) => {
      if (!aborted) {
        aborted = true
        await route.abort('failed')
        return
      }
      await route.continue()
    })
    await page.goto('/watch/movie/1007757')
    await expect(page.locator('iframe[title*="playback"]')).toHaveAttribute('src', /vidsrc\.xyz/, { timeout: 3_000 })
  })

  test('manual server switching replaces the iframe immediately', async ({ page }) => {
    await page.goto('/browse')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/watch/movie/1007757')
    const frame = page.locator('iframe[title*="playback"]')
    await page.getByRole('button', { name: /Server 2/ }).click()
    await expect(frame).toHaveAttribute('src', /vidsrc\.xyz/, { timeout: 1_000 })
  })

  test('rejects malformed TV route segments', async ({ page }) => {
    const response = await page.goto('/watch/tv/1399/1abc/1')
    expect(response).toBeTruthy()
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('exposes a bounded, semantic server control surface', async ({ page }) => {
    await page.goto('/watch/movie/1007757')
    await expect(page.getByRole('group', { name: 'Playback servers' })).toBeVisible()
    const servers = page.getByRole('button', { name: /Server [1-4]/ })
    await expect(servers).toHaveCount(4)
    await expect(page.getByRole('group', { name: 'Playback servers' }).locator('button[aria-pressed="true"]')).toHaveCount(1)
    await expect(page.locator('iframe[title*="playback"]')).toHaveAttribute('sandbox', /allow-scripts/)
    await expect(page.locator('iframe[title*="playback"]')).not.toHaveAttribute('sandbox', /allow-top-navigation/)
  })

  test('keeps the player usable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/watch/movie/1007757')
    const frame = page.locator('iframe[title*="playback"]')
    await expect(frame).toHaveClass(/opacity-100/)
  })

  test('does not overflow the viewport on mobile-sized layouts', async ({ page }) => {
    await page.goto('/watch/movie/1007757')
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      frameWidth: document.querySelector('iframe')?.getBoundingClientRect().width ?? 0,
    }))
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport + 1)
    expect(metrics.frameWidth).toBeGreaterThan(0)
  })

  test('allows keyboard activation of server controls without focus theft', async ({ page }) => {
    await page.goto('/watch/movie/1007757')
    await expect(page.getByRole('group', { name: 'Playback servers' }).locator('button[aria-pressed="true"]')).toHaveCount(1)
    const secondServer = page.getByRole('button', { name: /Server 2/ })
    await secondServer.focus()
    await expect(secondServer).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(secondServer).toHaveAttribute('aria-pressed', 'true')
    await expect(secondServer).toBeFocused()
  })

  test('stops and restarts attempts across deterministic offline/reconnect events', async ({ page }) => {
    await page.addInitScript(() => {
      let online = true
      Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online })
      Object.defineProperty(window, '__setVeyraOnline', {
        configurable: true,
        value: (next: boolean) => { online = next },
      })
    })
    await page.goto('/watch/movie/1007757')
    const group = page.getByRole('group', { name: 'Playback servers' })
    await expect(group).toBeVisible()

    await page.evaluate(() => {
      ;(window as Window & { __setVeyraOnline?: (next: boolean) => void }).__setVeyraOnline?.(false)
      window.dispatchEvent(new Event('offline'))
    })
    await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible()

    await page.evaluate(() => {
      ;(window as Window & { __setVeyraOnline?: (next: boolean) => void }).__setVeyraOnline?.(true)
      window.dispatchEvent(new Event('online'))
    })
    await expect(group).toBeVisible()
  })

})
