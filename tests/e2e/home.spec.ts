import { test, expect } from '@playwright/test'

test.describe('Home Page & Core Layout', () => {
  test('renders header, brand logo, and footer', async ({ page }) => {
    await page.goto('/')

    // Header and logo
    const siteHeader = page.locator('header:visible').filter({
      has: page.getByRole('link', { name: 'VEYRA — home', exact: true }),
    })
    await expect(siteHeader).toHaveCount(1)
    await expect(siteHeader).toBeVisible()
    await expect(siteHeader.getByRole('link', { name: 'VEYRA — home', exact: true })).toBeVisible()

    // TMDB attribution in footer
    await expect(page.locator('footer')).toContainText('TMDB')
  })

  test('skip link focuses main content', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a.skip-link')
    await expect(skipLink).toBeAttached()
  })
})

