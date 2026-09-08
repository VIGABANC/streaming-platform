import { test, expect } from '@playwright/test'

test.describe('Responsive Navigation', () => {
  test('landing product-story fallbacks retain actionable routes when TV data is unavailable', async ({ page }) => {
    await page.setExtraHTTPHeaders({ 'x-veyra-e2e-landing-data': 'unavailable' })
    await page.goto('/')

    const seasons = page.getByRole('region', { name: 'Every season. Every episode.' })
    await expect(seasons.getByText('Season information is unavailable right now.')).toBeVisible()
    await expect(seasons.getByRole('link', { name: 'Explore TV shows' })).toHaveAttribute('href', '/tv')

    const library = page.getByRole('region', { name: 'Your night, remembered.' })
    await expect(library.getByRole('link', { name: 'Explore the catalog' })).toHaveAttribute('href', '/browse')
    await expect(library.getByRole('link', { name: 'Open My List' })).toHaveAttribute('href', '/my-list')
  })

  test('landing footer and final CTA use real routes and preserve provider boundaries', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Explore VEYRA' }).last()).toHaveAttribute('href', '/browse')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
    await expect(footer.getByRole('link', { name: 'Favorites' })).toHaveAttribute('href', '/favorites')
    await expect(footer.getByText('VEYRA does not host or store video media. Playback is provided by third-party providers.')).toBeVisible()
  })

  test('mobile bottom navigation displays navigation items on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]')
    await expect(mobileNav).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Movies' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'TV' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Discover' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'My List' })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  })

  test('desktop header navigation is visible on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const mainNav = page.getByRole('banner').getByRole('navigation', { name: 'Main navigation' })
    await expect(mainNav).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Movies' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'TV Shows' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Discover' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Search' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Watchlist' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Explore VEYRA' })).toHaveAttribute('href', '/browse')
  })

  test('landing mobile menu exposes all navigation choices and closes with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
    await menuButton.click()
    const mainNav = page.locator('#landing-mobile-menu').getByRole('navigation', { name: 'Main navigation' })
    await expect(mainNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Discover' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Movies' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'TV Shows' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Search' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Watchlist' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })

  test('landing mobile menu applies its final state immediately with reduced motion', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const menuButton = page.getByRole('button', { name: 'Open navigation menu' })
    const menu = page.locator('#landing-mobile-menu')
    await menuButton.click()

    const opacitySamples = await menu.evaluate((element) => new Promise<string[]>((resolve) => {
      requestAnimationFrame(() => {
        const first = getComputedStyle(element).opacity
        requestAnimationFrame(() => resolve([first, getComputedStyle(element).opacity]))
      })
    }))
    expect(opacitySamples).toEqual(['1', '1'])
    await expect(menu.getByRole('link', { name: 'Home' })).toHaveAttribute('tabindex', '0')

    await page.keyboard.press('Escape')
    await expect(menuButton).toBeFocused()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
  })
})
