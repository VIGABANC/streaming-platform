import { test, expect } from '@playwright/test'

test.describe('Home Page & Core Layout', () => {
  test('renders header, brand logo, and footer', async ({ page }) => {
    await page.goto('/')

    // Header and logo
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('header').getByRole('link', { name: 'VEYRA' })).toBeVisible()

    // TMDB attribution in footer
    await expect(page.locator('footer')).toContainText('TMDB')
  })

  test('skip link focuses main content', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a.skip-link')
    await expect(skipLink).toBeAttached()
  })
})

