import { test, expect } from '@playwright/test'

test('malformed TV watch parameters do not fall back to episode one', async ({ page }) => {
  await page.goto('/watch/tv/1399/1abc/2')

  await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)
})
