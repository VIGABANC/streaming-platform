import { test, expect, type Page } from '@playwright/test'

const PLAYER_HEALTH_STORAGE_KEY = 'veyra-player-health-v1'
const PROVIDER_IDS = ['vidfast', 'vidlink', '2embed', 'videasy', 'nontongo']

async function seedReorderedProviderHealth(page: Page) {
  await page.addInitScript(({ key }) => {
    const now = Date.now()
    window.localStorage.setItem(key, JSON.stringify({
      videasy: {
        providerId: 'videasy',
        attempts: 10,
        successes: 10,
        failures: 0,
        consecutiveFailures: 0,
        successEWMA: 1,
        startupLatencyEWMA: 100,
        circuit: 'CLOSED',
        updatedAt: now,
      },
    }))
  }, { key: PLAYER_HEALTH_STORAGE_KEY })
}

async function gotoUnavailableMovie(page: Page) {
  await page.addInitScript(({ key, providerIds }) => {
    const now = Date.now()
    const health = Object.fromEntries(providerIds.map((providerId: string) => [providerId, {
      providerId,
      attempts: 2,
      successes: 0,
      failures: 2,
      consecutiveFailures: 2,
      circuit: 'OPEN',
      cooldownUntil: now + 60_000,
      updatedAt: now,
    }]))
    window.localStorage.setItem(key, JSON.stringify(health))
  }, { key: PLAYER_HEALTH_STORAGE_KEY, providerIds: PROVIDER_IDS })
  await page.goto('/watch/movie/1007757')
}

test.describe('Player reliability shell', () => {
  test('keeps provider order deterministic across server and client hydration', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    await seedReorderedProviderHealth(page)
    await page.goto('/watch/movie/550')
    await expect(page.getByRole('group', { name: 'Playback servers' })).toBeVisible()
    expect(consoleErrors.filter((message) => /hydration failed|hydration mismatch/i.test(message))).toEqual([])
  })

  test('labels opaque provider frames as unverified without claiming playback', async ({ page }) => {
    await page.goto('/watch/movie/550')
    await expect(page.getByRole('group', { name: 'Playback servers' })).toBeVisible()
    await expect(page.getByText('UNVERIFIED').first()).toBeVisible()
    await expect(page.getByText('Playback: Provider controlled')).toBeVisible()
    await expect(page.getByTitle('A frame load does not verify playback')).toBeVisible()
    await expect(page.locator('iframe[title*="playback"]')).toHaveCount(1)
  })

  test('does not expose unverified server controls as playable sources', async ({ page }) => {
    await page.goto('/browse')
    await gotoUnavailableMovie(page)
    await expect(page.getByText('No verified provider is configured for this media type.')).toBeVisible()
    await expect(page.locator('iframe[title*="playback"]')).toHaveCount(0)
  })

  test('keeps playback unavailable when all providers are unverified', async ({ page }) => {
    await gotoUnavailableMovie(page)
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
    await gotoUnavailableMovie(page)
    await expect(page.getByText('No verified provider is configured for this media type.')).toBeVisible()
    const servers = page.getByRole('button', { name: /Server [1-4]/ })
    await expect(servers).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Playback servers' }).locator('button[aria-pressed="true"]')).toHaveCount(0)
    await expect(page.locator('iframe[title*="playback"]')).toHaveCount(0)
  })

  test('keeps the player usable with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await gotoUnavailableMovie(page)
    await expect(page.getByRole('heading', { name: 'Stream Unavailable on This Server' })).toBeVisible()
  })

  test('does not overflow the viewport on mobile-sized layouts', async ({ page }) => {
    await gotoUnavailableMovie(page)
    await expect(page.getByRole('heading', { name: 'Stream Unavailable on This Server' })).toBeVisible()
    const metrics = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      playerWidth: document.querySelector('main')?.getBoundingClientRect().width ?? 0,
    }))
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.viewport + 1)
    expect(metrics.playerWidth).toBeGreaterThan(0)
  })

  test('supports keyboard activation of theater mode without focus theft', async ({ page }) => {
    await gotoUnavailableMovie(page)
    await expect(page.getByRole('heading', { name: 'Stream Unavailable on This Server' })).toBeVisible()
    const theater = page.getByRole('button', { name: 'Enter theater mode' })
    await theater.focus()
    await expect(theater).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Exit theater mode' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Exit theater mode' })).toBeFocused()
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
    await gotoUnavailableMovie(page)
    await expect(page.getByRole('heading', { name: 'Stream Unavailable on This Server' })).toBeVisible()

    await page.evaluate(() => {
      ;(window as Window & { __setVeyraOnline?: (next: boolean) => void }).__setVeyraOnline?.(false)
      window.dispatchEvent(new Event('offline'))
    })
    await expect(page.getByRole('heading', { name: "You're offline" })).toBeVisible()

    await page.evaluate(() => {
      ;(window as Window & { __setVeyraOnline?: (next: boolean) => void }).__setVeyraOnline?.(true)
      window.dispatchEvent(new Event('online'))
    })
    await expect(page.getByText('No verified provider is configured for this media type.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Stream Unavailable on This Server' })).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('persists server selection while keeping unverified playback unavailable', async ({ page }) => {
    await page.goto('/settings')
    const selection = page.getByLabel('Server Selection')
    await selection.selectOption('manual')
    await expect(selection).toHaveValue('manual')
    await page.reload()
    await expect(page.getByLabel('Server Selection')).toHaveValue('manual')

    await gotoUnavailableMovie(page)
    await expect(page.getByText('No verified provider is configured for this media type.')).toBeVisible()
    await expect(page.locator('iframe[title*="playback"]')).toHaveCount(0)
  })

  test('retry and reload preserve the unavailable state without eligible sources', async ({ page }) => {
    await gotoUnavailableMovie(page)
    const unavailable = page.getByRole('heading', { name: 'Stream Unavailable on This Server' })
    await expect(unavailable).toBeVisible()
    await page.getByRole('button', { name: /Retry/ }).click()
    await expect(unavailable).toBeVisible()
    await page.getByRole('button', { name: 'Reload player' }).click()
    await expect(unavailable).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('keeps theater, lights-off, and fullscreen controls available on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoUnavailableMovie(page)
    await expect(page.getByRole('button', { name: /Turn lights on|Turn lights off/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Enter theater mode|Exit theater mode/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Enter full screen player|Exit full screen player/ })).toBeVisible()
  })

})
