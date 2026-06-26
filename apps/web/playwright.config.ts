import { firebaseEmulatorWebServer } from '@cbrl/testing/firebase'
import { defineConfig, devices } from '@playwright/test'

import { BASE_URL, E2E_PORT } from './e2e/constants'

const PROJECT_ID = 'tekoa-local'

export default defineConfig({
  testDir: './src',
  testMatch: '**/_e2e/**/*.spec.ts',
  // Parallel-safe: no global wipe, and every seed gets a per-test-unique title
  // (see e2e/fixtures.ts), so workers sharing the emulator project never clobber
  // each other. Specs navigate by unique slug or assert against the returned
  // title — never a hard-coded string.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  // Auth é opt-in por teste: specs que precisam de sessão declaram
  // `test.use({ authAsBroker: true })`, e a fixture worker-scoped autentica como
  // o broker daquele worker. Specs sem isso rodam anônimos.
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Emulator hosts + GCLOUD_PROJECT are injected by `firebase emulators:exec`
  // (the `test:e2e` script) and inherited here; only the app-specific public
  // test values are passed below.
  webServer: firebaseEmulatorWebServer({
    command: 'pnpm run dev',
    port: E2E_PORT,
    projectId: PROJECT_ID,
    env: {
      NEXT_PUBLIC_MAPTILER_API_KEY: 'ci-local',
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      NOMINATIM_URL: `${BASE_URL}/api/_test/nominatim`,
    },
  }),
})
