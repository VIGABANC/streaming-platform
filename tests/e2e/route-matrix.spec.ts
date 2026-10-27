import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const publicRoutes = [
  '/', '/browse', '/movies', '/tv', '/discover', '/new', '/top10',
  '/world-cinema', '/providers', '/my-list', '/favorites', '/history',
  '/profile', '/settings', '/offline', '/auth/login', '/auth/sign-up',
  '/search', '/anime', '/genre/movie/28', '/genre/tv/18',
  '/person/1136406', '/collection/531241', '/provider/netflix',
  '/streaming/8', '/watch/movie/550', '/watch/tv/1399/1/1',
  '/watch/anime/1/1', '/landing', '/audit',
]

const animeIds = [1, 20, 21, 1535, 1575, 5114, 9253, 11061, 16498, 30276]
const movieIds = [550, 603, 27205, 157336, 278, 13, 238, 680, 497, 155]
const invalidRoutes = ['/movie/not-an-id', '/tv/0', '/watch/tv/1399/0/1', '/watch/anime/52991/0', '/route-that-does-not-exist']

async function assertRouteHealth(page: Page, route: string) {
  const consoleErrors: string[] = []
  const serverErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('response', (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.url()}`)
  })

  const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 })
  expect(response?.status(), `${route} initial response`).toBeLessThan(400)
  await expect(page.getByRole('main')).toBeVisible({ timeout: 30000 })
  await expect(page).toHaveTitle(/.+/)
  await expect(page.locator('body')).not.toContainText('Application error', { timeout: 5000 })

  const a11y = await new AxeBuilder({ page }).exclude('iframe').analyze()
  const blockingViolations = a11y.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
  expect(blockingViolations, `${route} accessibility violations`).toEqual([])
  expect(serverErrors, `${route} server errors`).toEqual([])
  expect(consoleErrors, `${route} console errors`).toEqual([])
}

test.describe('public route matrix', () => {
  test.setTimeout(120000)

  for (const route of publicRoutes) {
    test(`${route} renders a healthy page shell`, async ({ page }) => {
      await assertRouteHealth(page, route)
    })
  }
})

test.describe('anime detail matrix', () => {
  test.setTimeout(120000)

  for (const id of animeIds) {
    test(`/anime/${id} renders truthful detail and playback state`, async ({ page }) => {
      await assertRouteHealth(page, `/anime/${id}`)
      await expect(page.getByText('Anime signal')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Playback unavailable' })).toBeVisible()
      await expect(page.locator('iframe')).toHaveCount(0)
    })
  }
})

test.describe('movie detail matrix', () => {
  test.setTimeout(120000)

  for (const id of movieIds) {
    test(`/movie/${id} renders a detail or explicit unavailable state`, async ({ page }) => {
      await assertRouteHealth(page, `/movie/${id}`)
      await expect(page.locator('h1').first()).toBeVisible()
    })
  }
})

test.describe('invalid route matrix', () => {
  test.setTimeout(120000)

  for (const route of invalidRoutes) {
    test(`${route} renders the owned not-found state`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 })
      // Next 16 may stream a dynamic not-found boundary after the response
      // starts, which is a documented soft-404 (HTTP 200) behavior. The
      // owned not-found UI and noindex signal are the stable application gate.
      expect(response?.status(), `${route} initial response`).toBeLessThan(500)
      await expect(page.getByRole('main')).toBeVisible({ timeout: 30000 })
      await expect(page).toHaveTitle(/.+/)
      await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible()
      await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toHaveCount(1)
    })
  }
})
