import { test, expect } from '@playwright/test'

test.describe('Player reliability shell', () => {
  test('does not expose unverified server controls as playable sources', async ({ page }) => {
    await page.goto('/browse')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/watch/movie/1007757')
    await expect(page.getByText('No verified provider is configured for this media type.')).toBeVisible()
    await expect(page.locator('iframe[title*="playback"]')).toHaveCount(0)
  })

  test('keeps playback unavailable when all providers are unverified', async ({ page }) => {
    await page.goto('/watch/movie/1007757')
    await expect(page.getByRole('heading', { name: 'Stream Unavailable on This Server' })).toBeVisible()
    await expect(page.locator('iframe[title*="playback"]')).toHaveCount(0)
  })

  test('rejects malformed TV route segments', async ({ page }) => {
    const response = await page.goto('/watch/tv/1399/1abc/1')
    expect(response).toBeTruthy()
    await expect(page.locator('body')).toContainText('Page Not Found')
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('exposes a bounded, semantic server control surface', async ({ page }) => {
    await page.goto('/watch/movie/1007757')
    await expect(page.getByRole('group', { name: 'Playback servers' })).toBeVisible()
    const servers = page.getByRole('button', { name: /Server [1-4]/ })
    await expect(servers).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Playback servers' }).locator('button[aria-pressed="true"]')).toHaveCount(0)
    await expect(page.locator('iframe[title*="playback"]')).toHaveCount(0)
  })

  test('keeps the player usable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/watch/movie/1007757')
    await expect(page.getByRole('heading', { name: 'Stream Unavailable on This Server' })).toBeVisible()
  })

  test('does not overflow the viewport on mobile-sized layouts', async ({ page }) => {
    await page.goto('/watch/movie/1007757')
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      playerWidth: document.querySelector('[aria-label="Playback servers"]')?.getBoundingClientRect().width ?? 0,
    }))
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport + 1)
    expect(metrics.playerWidth).toBeGreaterThan(0)
  })

  test('supports keyboard activation of theater mode without focus theft', async ({ page }) => {
    await page.goto('/watch/movie/1007757')
    const theater = page.getByRole('button', { name: 'Enter theater mode' })
    await theater.focus()
    await expect(theater).toBeFocused()
    await page.keyboard.press('t')
    await expect(page.getByRole('button', { name: 'Exit theater mode' })).toHaveAttribute('aria-pressed', 'true')
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

  test('keeps theater, lights-off, and fullscreen controls available on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/watch/movie/1007757')
    await expect(page.getByRole('button', { name: /Lights On|Lights Off/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Theater/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Full screen player|Exit full screen player/ })).toBeVisible()
  })

})
