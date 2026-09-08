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
    await page.route('**/*', async (route) => {
      if (!route.request().isNavigationRequest()) return route.continue()

      await route.continue({
        headers: {
          ...route.request().headers(),
          'x-veyra-e2e-landing-data': 'unavailable',
        },
      })
    })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find the story worth staying up for.')
    await expect(page.getByRole('region', { name: 'Featured story' }).locator('img')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Start Exploring' })).toHaveAttribute('href', '/browse')
    await expect(page.getByRole('link', { name: 'Trending Tonight' })).toHaveAttribute('href', '#trending-tonight')
    await expect(page.getByTestId('media-rail-trending-tonight')).toBeVisible()
    await expect(page.getByTestId('media-rail-trending-tonight')).toContainText('The signal is quiet for now. Check back shortly.')
    await expect(page.getByTestId('discovery-showcase')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Popular', exact: true })).toHaveAttribute('href', '/discover')
    await expect(page.getByRole('link', { name: 'Airing Today', exact: true })).toHaveAttribute('href', '/tv')
  })

  test('skip link is focusable and targets main content', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a.skip-link')
    await expect(skipLink).toBeAttached()
    await skipLink.focus()
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  test('renders the catalog feed at /browse', async ({ page }) => {
    await page.goto('/browse')

    await expect(page).toHaveURL(/\/browse$/)
    await expect(page.locator('header')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })
})

