import { readLocalSupabase } from '@cbrl/supabase/local'
import { defineE2EConfig } from '@cbrl/testing/playwright'
import { defineConfig } from '@playwright/test'

import { BASE_URL, E2E_PORT } from './e2e/constants'

// E2E runs against the LOCAL Supabase stack (`pnpm db:start`). Its URL, keys and
// database come from `supabase status`; setting them on process.env here makes
// both the Next server and the Playwright workers (fixtures seed through
// `@/db` and the Supabase admin API) inherit them.
const local = readLocalSupabase()
const supabaseEnv = {
  NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
  SUPABASE_SECRET_KEY: local.secretKey,
  POSTGRES_URL: local.dbUrl,
}
Object.assign(process.env, supabaseEnv)

// Parallel-safe: no global wipe, and every seed gets a per-test-unique title
// (see e2e/fixtures.ts), so workers sharing the local database never clobber
// each other. Auth is opt-in per test (`test.use({ authAsBroker: true })`).
// CI serves the production build; the env below is set before `next build`, so
// the NEXT_PUBLIC_* values are inlined for the local stack.
export default defineConfig(
  defineE2EConfig({
    port: E2E_PORT,
    testDir: './src',
    testMatch: '**/_e2e/**/*.spec.ts',
    webServerEnv: {
      ...supabaseEnv,
      ENABLE_TEST_AUTH: 'true',
      NEXT_PUBLIC_MAPTILER_API_KEY: 'ci-local',
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      NOMINATIM_URL: `${BASE_URL}/api/_test/nominatim`,
    },
  }),
)
