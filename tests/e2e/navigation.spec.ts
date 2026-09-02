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
  })

  test('desktop header navigation is visible on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const mainNav = page.locator('nav[aria-label="Main navigation"]')
    await expect(mainNav).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Home' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Movies' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'TV Shows' })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Discover' })).toBeVisible()
  })
})


