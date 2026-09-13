import { test, expect } from '@playwright/test'

test.describe('Anime playback boundary', () => {
  test('keeps anime playback unavailable without a verified episode provider', async ({ page }) => {
    await page.goto('/watch/anime/1/1')
    await expect(page.getByRole('heading', { name: 'Playback unavailable for this media type' })).toBeVisible()
    await expect(page.getByText('No iframe or playback claim is presented.')).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
  })

  test('rejects malformed anime route segments', async ({ page }) => {
    await page.goto('/watch/anime/1abc/1')
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible()
    await expect(page.locator('iframe')).toHaveCount(0)
  })
})
