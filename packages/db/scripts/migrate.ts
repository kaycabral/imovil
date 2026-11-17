import { closeImovilDb, runImovilMigrations } from '../src/index'

/**
 * Apply `drizzle/` to `POSTGRES_URL_NON_POOLING` (preferred: session/direct URL)
 * or `POSTGRES_URL`. Locally both point at the Supabase stack (54322).
 */
if (process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING
}

try {
  await runImovilMigrations()
  console.log('imovil migrations applied')
} finally {
  await closeImovilDb()
}
