import { defineConfig, devices } from '@playwright/test'

import { BASE_URL } from './e2e/constants'
import { readLocalSupabase } from './e2e/local-supabase'

// E2E runs against the LOCAL Supabase stack (`pnpm db:start`). Its URL, keys and
// database come from `supabase status`; setting them on process.env here makes
// both the Next server and the Playwright workers (fixtures seed through
// `@imovil/db` and the Supabase admin API) inherit them.
const local = readLocalSupabase()
const supabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
  SUPABASE_SECRET_KEY: local.secretKey,
  POSTGRES_URL: local.dbUrl,
}
Object.assign(process.env, supabaseEnv)

export default defineConfig({
  testDir: './src',
  testMatch: '**/_e2e/**/*.spec.ts',
  // Parallel-safe: no global wipe, and every seed gets a per-test-unique title
  // (see e2e/fixtures.ts), so workers sharing the local database never clobber
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
  webServer: {
    // CI runs the production build: no on-demand compilation (a server action's
    // first call in `next dev` can outlast an assertion timeout) and closer to
    // what ships. The env below is set before `next build`, so the NEXT_PUBLIC_*
    // values are inlined for the local stack. Locally, `next dev` keeps the loop fast.
    command: process.env.CI ? 'pnpm run build && pnpm run start -p 3003' : 'pnpm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 300_000 : 120_000,
    env: {
      ...supabaseEnv,
      ENABLE_TEST_AUTH: 'true',
      NEXT_PUBLIC_MAPTILER_API_KEY: 'ci-local',
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      NOMINATIM_URL: `${BASE_URL}/api/_test/nominatim`,
    },
  },
})
