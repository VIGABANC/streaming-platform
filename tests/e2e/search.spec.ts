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

  test('submits the landing finder with the API query contract and renders movie and TV results', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/api/search*', async (route) => {
      const url = new URL(route.request().url())
      expect(url.searchParams.get('query')).toBe('Dune')
      expect(url.searchParams.get('q')).toBeNull()
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { id: 438631, title: 'Dune', media_type: 'movie', release_date: '2021-09-15', vote_average: 8.2, poster_path: null },
            { id: 1399, name: 'Dune: Prophecy', media_type: 'tv', first_air_date: '2024-11-17', vote_average: 7.1, poster_path: null },
          ],
        }),
      })
    })
    await page.goto('/')

    const finder = page.getByRole('search', { name: '' }).filter({ has: page.getByLabel('Search the catalog') })
    const input = finder.getByLabel('Search the catalog')
    await input.fill('Dune')
    await input.press('Enter')

    const results = page.locator('[data-search-showcase-results]')
    await expect(results.getByRole('link', { name: /Dune.*Film.*2021.*8\.2/ })).toHaveAttribute('href', '/movie/438631')
    await expect(results.getByRole('link', { name: /Dune: Prophecy.*TV.*2024.*7\.1/ })).toHaveAttribute('href', '/tv/1399')
  })

  test('renders the empty finder state separately from an API failure', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/api/search*', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ results: [] }) }))
    await page.goto('/')

    const finder = page.getByRole('search', { name: '' }).filter({ has: page.getByLabel('Search the catalog') })
    await finder.getByLabel('Search the catalog').fill('Void')

    const results = page.locator('[data-search-showcase-results]')
    await expect(results).toContainText('No signals found')
    await expect(results.getByRole('link', { name: 'Browse the catalog' })).toHaveAttribute('href', '/browse')
  })

  test('renders the finder error state when the API fails', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.route('**/api/search*', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'SEARCH_UNAVAILABLE' }) }))
    await page.goto('/')

    const finder = page.getByRole('search', { name: '' }).filter({ has: page.getByLabel('Search the catalog') })
    await finder.getByLabel('Search the catalog').fill('Dune')

    const results = page.locator('[data-search-showcase-results]')
    await expect(results).toContainText('Search unavailable')
    await expect(results.getByRole('button', { name: 'Retry' })).toBeVisible()
  })
})

