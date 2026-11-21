// Write the LOCAL Supabase stack values into `.env.local` (creating it from
// `.env.example` when missing), keeping every other line untouched. Run after
// `pnpm db:start`: `pnpm db:env`.

import { findSupabaseAppDir, readLocalSupabase, writeEnvLocal } from '@cbrl/supabase/local'

const local = readLocalSupabase()
const target = writeEnvLocal(
  {
    NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
    POSTGRES_URL: local.dbUrl,
  },
  { appDir: findSupabaseAppDir() },
)
console.log(`Local Supabase values written to ${target}`)
