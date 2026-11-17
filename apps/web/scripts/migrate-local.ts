// Apply the @imovil/db migrations to the LOCAL Supabase stack (run by
// `pnpm db:start`). Production uses `pnpm --filter @imovil/db db:migrate`
// with POSTGRES_URL_NON_POOLING pulled from Vercel.

import { closeImovilDb, runImovilMigrations } from '@imovil/db'

import { readLocalSupabase } from '../e2e/local-supabase'

async function main(): Promise<void> {
  process.env.POSTGRES_URL = readLocalSupabase().dbUrl
  try {
    await runImovilMigrations()
    console.log('imovil migrations applied to the local stack')
  } finally {
    await closeImovilDb()
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exitCode = 1
})
