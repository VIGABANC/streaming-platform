import { test, expect } from '@playwright/test'

test.describe('Responsive Navigation', () => {
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
