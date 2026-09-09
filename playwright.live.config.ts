import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/live',
  timeout: 45_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_LIVE_BASE_URL || 'https://streaming-platform-beryl.vercel.app',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
