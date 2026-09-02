import { test, expect } from '@playwright/test'

test.describe('Search Flow', () => {
  test('navigates to search and allows input typing with URL persistence', async ({ page }) => {
    await page.goto('/search')

    const input = page.getByRole('textbox', { name: 'Search movies and series' })
    await expect(input).toBeVisible()

    await input.fill('Spider')
    await page.waitForTimeout(400) // debounce delay

    // URL should have ?q=Spider
    await expect(page).toHaveURL(/q=Spider/)
  })

  test('clearing input resets search query and URL', async ({ page }) => {
    await page.goto('/search?q=Avatar')
    const input = page.getByRole('textbox', { name: 'Search movies and series' })
    await expect(input).toHaveValue('Avatar')

    const clearBtn = page.getByRole('button', { name: 'Clear search' })
    await expect(clearBtn).toBeVisible()
    await clearBtn.click()

    await page.waitForTimeout(400)
    await expect(page).toHaveURL(/\/search$/)
  })
})

