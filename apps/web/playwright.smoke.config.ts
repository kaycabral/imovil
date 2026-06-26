import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.SMOKE_BASE_URL
if (!baseURL) {
  throw new Error('SMOKE_BASE_URL is required (the deployed staging URL).')
}

export default defineConfig({
  testDir: './_smoke',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
