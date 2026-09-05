import { test, expect } from '@playwright/test'

test('profile does not render a guest as an account owner', async ({ page }) => {
  await page.goto('/profile')

  await expect(page.getByRole('heading', { name: /sign in to your account/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login')
})
