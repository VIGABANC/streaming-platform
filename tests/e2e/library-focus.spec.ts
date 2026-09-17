import { test, expect } from '@playwright/test'

test('account menu supports keyboard focus, Escape and focus return', async ({ page }) => {
  await page.goto('/settings')
  const trigger = page.getByRole('button', { name: 'User Profile & Settings' })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem').first()).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(menu.getByRole('menuitem').nth(1)).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('reset dialog traps focus and cancellation preserves local library', async ({ page }) => {
  await page.goto('/settings')
  await page.evaluate(() => localStorage.setItem('veyra-watchlist', JSON.stringify([{ id: 1, media_type: 'movie', title: 'Kept', addedAt: 1 }])))
  const trigger = page.getByRole('button', { name: 'Reset Everything' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Reset current library?' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('button', { name: 'Yes, wipe everything' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('veyra-watchlist') ?? '[]')[0]?.title)).toBe('Kept')
})

test('profile editing focuses labelled fields and returns focus on cancel', async ({ page }) => {
  await page.goto('/profile')
  const trigger = page.getByRole('button', { name: 'Edit Profile' })
  await trigger.click()
  await expect(page.getByRole('textbox', { name: 'Display name' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})

test('anonymous library survives navigation and reload across its views', async ({ page }) => {
  await page.goto('/my-list')
  await page.evaluate(() => {
    const item = { id: 1, title: 'Local saved title', media_type: 'movie', addedAt: 1, favoritedAt: 1, watchedAt: 1 }
    for (const key of ['watchlist', 'favorites', 'history']) localStorage.setItem(`veyra-${key}`, JSON.stringify([item]))
  })
  for (const path of ['/my-list', '/favorites', '/history']) {
    await page.goto(path)
    await expect(page.getByRole('main')).toContainText('Local saved title')
    await page.reload()
    await expect(page.getByRole('main')).toContainText('Local saved title')
  }
})
