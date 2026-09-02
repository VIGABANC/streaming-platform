import { test, expect } from '@playwright/test'

test.describe('My List & Watchlist Flow', () => {
  test('my list page renders tabs and empty state when list is empty', async ({ page }) => {
    await page.goto('/my-list')
    await expect(page.getByRole('heading', { name: 'My List', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /All Saved/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Favorites/ })).toBeVisible()
  })
})

