import { test, expect } from '@playwright/test'

test.describe('Anime discovery', () => {
  test('exposes Anime in desktop and mobile navigation', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Anime', exact: true }).first()).toBeVisible()

    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Menu', exact: true }).click()
    await expect(page.getByRole('navigation', { name: 'Main navigation', exact: true }).getByRole('link', { name: 'Anime', exact: true })).toBeVisible()
  })

  test('opens the anime catalog with filterable content taxonomy', async ({ page }) => {
    await page.goto('/anime?status=FINISHED&format=TV&genre=Action')
    await expect(page).toHaveURL(/\/anime\?status=FINISHED&format=TV&genre=Action/)
    await expect(page.getByRole('heading', { name: 'Anime', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Anime movies', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Anime series', exact: true })).toBeVisible()
  })

  test('keeps anime search as a separate result category', async ({ page }) => {
    await page.goto('/search?q=One%20Piece')
    await expect(page.getByRole('textbox', { name: 'Search movies, series, and anime' })).toHaveValue('One Piece')
    await page.waitForTimeout(450)
    const animeTab = page.getByRole('button', { name: /Anime \(/ })
    await expect(animeTab).toBeVisible()
  })
})
