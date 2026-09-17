import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'
const usesLocalWebServer = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/.test(baseURL)
const artifactProject = (process.env.VEYRA_E2E_PROJECT || 'all').replace(/[^a-z0-9-]/gi, '-').toLowerCase()

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // Next's streamed shell can briefly expose the same landmark twice when
  // multiple cold production pages render concurrently; keep smoke assertions deterministic.
  workers: 1,
  outputDir: `test-results/${artifactProject}`,
  reporter: [['list'], ['html', { outputFolder: `playwright-report/${artifactProject}`, open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Keep cached service-worker shell state from leaking between isolated E2E contexts.
    // PWA registration and update behavior are covered by dedicated unit checks.
    serviceWorkers: 'block',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: usesLocalWebServer ? {
    command: `npm run start -- --port ${new URL(baseURL).port || (baseURL.startsWith('https:') ? '443' : '80')}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'playwright-anon-key',
      TMDB_API_KEY: process.env.TMDB_API_KEY || 'playwright-tmdb-key',
    },
  } : undefined,
})
