import { defineConfig, devices } from '@playwright/test'

/**
 * Provider smoke tests are intentionally isolated from deterministic CI.
 * They observe route/frame behavior only; an iframe load is not playback proof.
 */
export default defineConfig({
  testDir: './tests/live',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_LIVE_BASE_URL || 'https://streaming-platform-beryl.vercel.app',
    trace: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'live-chromium', use: { ...devices['Desktop Chrome'] } }],
})
