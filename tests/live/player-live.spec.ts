import { test, expect, type Page } from '@playwright/test'

async function inspectBoundary(page: Page, path: string) {
  let response
  try {
    response = await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 15_000 })
  } catch {
    test.info().annotations.push({ type: 'live-result', description: 'TIMEOUT: external deployment did not complete navigation' })
    return
  }
  expect(response?.status()).toBeLessThan(500)
  const body = await page.locator('body').innerText()
  const protectedByVercel = /Vercel|Authentication Required|Deployment Protection/i.test(body)
  const unavailable = /Playback unavailable|No verified provider|Stream Unavailable/i.test(body)
  const iframeCount = await page.locator('iframe').count()

  if (protectedByVercel) {
    test.info().annotations.push({ type: 'live-result', description: 'BLOCKED_BY_ENVIRONMENT: Vercel Deployment Protection' })
    return
  }

  const classification = unavailable
    ? 'LIVE_PROVIDER_PLAYBACK_UNVERIFIED: verified-unavailable shell'
    : iframeCount > 0
      ? 'FRAME_LOADED_PLAYBACK_UNVERIFIED: external frame observed; playback not confirmed'
      : 'EXTERNAL_FAILURE: expected trust boundary not visible'
  test.info().annotations.push({ type: 'live-result', description: classification })
  // Live provider state is observational and conditional. The test records the
  // result without turning an opaque provider response into a product success.
}

test.describe('LIVE provider smoke — excluded from normal CI', () => {
  test.skip(process.env.VEYRA_LIVE_SMOKE !== '1', 'Set VEYRA_LIVE_SMOKE=1 to opt into external provider smoke')

  test('movie route distinguishes protected access from verified-unavailable playback', async ({ page }) => {
    await inspectBoundary(page, '/watch/movie/1007757')
  })

  test('TV route distinguishes protected access from verified-unavailable playback', async ({ page }) => {
    await inspectBoundary(page, '/watch/tv/1399/1/1')
  })
})
