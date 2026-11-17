import { migrate } from 'drizzle-orm/node-postgres/migrator'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getImovilDb } from './pool'

/**
 * Apply the versioned migrations in `drizzle/` to the connected database.
 *
 * Used by the integration suite, local dev and E2E. Production runs
 * `pnpm --filter @imovil/db db:migrate` against the session/direct URL (the
 * transaction pooler does not support the migrator's advisory lock). Never call
 * this at app boot, and never use `drizzle-kit push` against production.
 */
export async function runImovilMigrations(): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url))
  await migrate(getImovilDb(), { migrationsFolder: path.resolve(here, '../drizzle') })
}
