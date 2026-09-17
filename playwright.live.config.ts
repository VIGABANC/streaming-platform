import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/live',
  timeout: 45_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-live-report', open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_LIVE_BASE_URL || 'https://streaming-platform-beryl.vercel.app',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
