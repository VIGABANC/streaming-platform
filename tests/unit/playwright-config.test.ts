import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

it('starts and probes the exact local target instead of a fixed port', async () => {
  vi.stubEnv('PLAYWRIGHT_TEST_BASE_URL', 'http://127.0.0.1:3107')
  const { default: config } = await import('../../playwright.config')
  expect(config.webServer).toMatchObject({ url: 'http://127.0.0.1:3107', command: 'npm run start -- --port 3107' })
  expect(config.webServer).not.toHaveProperty('port')
})

it('retains traces without relying on a retry', async () => {
  const { default: config } = await import('../../playwright.config')
  expect(config.retries).toBe(0)
  expect(config.use?.trace).toBe('retain-on-failure')
})

it('isolates project reports and test artifacts', async () => {
  vi.stubEnv('VEYRA_E2E_PROJECT', 'mobile-chrome')
  const { default: config } = await import('../../playwright.config')
  expect(config.outputDir).toBe('test-results/mobile-chrome')
  expect(config.reporter).toContainEqual(['html', { outputFolder: 'playwright-report/mobile-chrome', open: 'never' }])
})
