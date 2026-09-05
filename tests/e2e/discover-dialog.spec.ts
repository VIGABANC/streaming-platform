import { test, expect } from '@playwright/test'

test('mobile discover filters behave as an accessible dialog', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/discover')

  const trigger = page.getByRole('button', { name: 'Filters' })
  await trigger.click()

  const dialog = page.getByRole('dialog', { name: 'Filters' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Close filters' })).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
})
