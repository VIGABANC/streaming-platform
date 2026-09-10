import { test, expect } from '@playwright/test'

test.describe('Responsive Navigation', () => {
  test('mobile menu exposes navigation items on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.getByRole('button', { name: 'Menu', exact: true }).click()

    const mobileNav = page.getByRole('navigation', { name: 'Main navigation', exact: true })
    await expect(mobileNav).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Discover', exact: true })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'Movies', exact: true })).toBeVisible()
    await expect(mobileNav.getByRole('link', { name: 'TV Shows', exact: true })).toBeVisible()
  })

  test('desktop header navigation is visible on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const mainNav = page.getByRole('navigation').filter({ has: page.getByRole('link', { name: 'Discover', exact: true }) })
    await expect(mainNav).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Discover', exact: true })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Movies', exact: true })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'TV Shows', exact: true })).toBeVisible()
    await expect(mainNav.getByRole('link', { name: 'Streaming', exact: true })).toBeVisible()
  })
})


