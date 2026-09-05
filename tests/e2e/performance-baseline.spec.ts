import { test, expect } from '@playwright/test'

test('production landing page exposes fresh browser timing evidence', async ({ page }, testInfo) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))
  await page.goto('/landing', { waitUntil: 'networkidle' })
  await expect(page.locator('main')).toBeVisible()

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const paints = performance.getEntriesByType('paint') as PerformancePaintTiming[]
    return {
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      domContentLoadedMs: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.startTime) : null,
      loadMs: navigation ? Math.round(navigation.loadEventEnd - navigation.startTime) : null,
      firstPaintMs: Math.round(paints.find((entry) => entry.name === 'first-paint')?.startTime ?? 0),
      firstContentfulPaintMs: Math.round(paints.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? 0),
      resourceCount: performance.getEntriesByType('resource').length,
    }
  })

  expect(browserErrors, browserErrors.join('\n')).toEqual([])
  testInfo.attachments.push({ name: 'browser-timing.json', contentType: 'application/json', body: Buffer.from(JSON.stringify(metrics, null, 2)) })
  console.log(`[perf-baseline] ${testInfo.project.name}`, JSON.stringify(metrics))
})
