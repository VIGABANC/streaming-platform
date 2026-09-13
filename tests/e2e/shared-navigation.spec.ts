import { test, expect } from '@playwright/test'

const primaryLabels = ['Home', 'Movies', 'Series', 'Anime', 'New', 'Top 10', 'Discover', 'Watchlist', 'Favorites', 'History']

test.describe('Shared public navigation', () => {
  for (const route of ['/', '/anime', '/movies', '/tv', '/discover', '/anime/21', '/watch/anime/21/1']) {
    test(`${route} exposes the shared labelled navigation`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(route)
      const nav = page.getByRole('banner').getByRole('navigation', { name: 'Main navigation' }).first()
      await expect(nav).toBeVisible()
      for (const label of primaryLabels) await expect(nav.getByRole('link', { name: label, exact: true }).first()).toBeVisible()
      if (route.startsWith('/anime')) await expect(nav.getByRole('link', { name: 'Anime', exact: true }).first()).toHaveAttribute('aria-current', 'page')
    })
  }

  test('mobile menu manages focus and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const trigger = page.locator('button[aria-controls="landing-mobile-menu"]')
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })
})
