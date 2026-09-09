import { test, expect, type Page } from '@playwright/test'

const providers = [
  { label: 'Server 1', origin: 'v1.vidsrc.wiki' },
  { label: 'Server 2', origin: 'vidsrc.xyz' },
  { label: 'Server 3', origin: 'www.2embed.cc' },
  { label: 'Server 4', origin: 'player.autoembed.cc' },
]

async function inspectProvider(page: Page, label: string, origin: string) {
  await page.getByRole('button', { name: new RegExp(label) }).click()
  await page.waitForTimeout(3_000)
  const frame = page.locator('iframe').first()
  const src = await frame.getAttribute('src')
  const pageText = await page.locator('body').innerText()
  const result = pageText.includes('Unable to play media') || pageText.includes('could not be found')
    ? 'EXTERNAL_FAILURE'
    : src?.includes(origin)
      ? 'PLAYBACK_NOT_VERIFIABLE'
      : 'FRAME_ORIGIN_UNCONFIRMED'
  test.info().annotations.push({ type: 'provider-result', description: `${label}: ${result} (${src ?? 'no iframe'})` })
  expect(src).toContain(origin)
}

test.describe('LIVE provider smoke — excluded from normal CI', () => {
  test('movie 1007757 exposes each configured provider without claiming playback', async ({ page }) => {
    await page.goto('/watch/movie/1007757', { waitUntil: 'domcontentloaded' })
    for (const provider of providers) await inspectProvider(page, provider.label, provider.origin)
  })

  test('TV S1E1 exposes the configured provider controls', async ({ page }) => {
    await page.goto('/watch/tv/1399/1/1', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Season 1, Episode 1/)).toBeVisible()
    const frame = page.locator('iframe').first()
    await expect(frame).toHaveAttribute('src', /v1\.vidsrc\.wiki/)
  })
})
