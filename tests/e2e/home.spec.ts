import { test, expect } from '@playwright/test'

test.describe('Home Page & Core Layout', () => {
  test('renders header, brand logo, and footer', async ({ page }) => {
    await page.goto('/')

    // Header and logo
    const banner = page.getByRole('banner')
    await expect(banner).toBeVisible()
    await expect(banner.getByRole('link', { name: 'VEYRA — home', exact: true })).toBeVisible()

    // TMDB attribution in footer
    await expect(page.locator('footer')).toContainText('TMDB')
  })

  test('renders a usable cinematic hero when landing data is unavailable', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Exploring' })).toHaveAttribute('href', '/browse')
    await expect(page.getByRole('link', { name: 'Trending Tonight' })).toHaveAttribute('href', '#trending-tonight')
  })

  test('skip link focuses main content', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a.skip-link')
    await expect(skipLink).toBeAttached()
  })

  test('renders the catalog feed at /browse', async ({ page }) => {
    await page.goto('/browse')

    await expect(page).toHaveURL(/\/browse$/)
    await expect(page.locator('header')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })
})

