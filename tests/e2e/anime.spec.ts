import { test, expect } from '@playwright/test'

test.describe('Anime discovery', () => {
  test('anime catalog degrades safely when AniList is unavailable', async ({ page }) => {
    const response = await page.goto('/anime', { waitUntil: 'domcontentloaded' })

    expect(response?.status()).toBe(200)
    const main = page.locator('main').first()
    await expect(main).toBeVisible()
    await expect(main).toContainText(/Anime signal unavailable|Trending anime|Airing now/)
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('anime detail rejects malformed source IDs', async ({ page }) => {
    await page.goto('/anime/not-a-number', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
  })
})
