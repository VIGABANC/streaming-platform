import { test, expect } from '@playwright/test'

test.describe('TV Shows Discovery', () => {
  test('tv shows page renders header and series filters', async ({ page }) => {
    await page.goto('/tv')
    await expect(page.getByRole('heading', { name: 'TV Shows', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'All Series' })).toBeVisible()
  })
})
