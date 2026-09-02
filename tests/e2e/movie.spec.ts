import { test, expect } from '@playwright/test'

test.describe('Movie Discovery & Detail', () => {
  test('movies page renders hero and genre filters', async ({ page }) => {
    await page.goto('/movies')
    await expect(page.getByRole('heading', { name: 'Movies', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'All Movies' })).toBeVisible()
  })
})
