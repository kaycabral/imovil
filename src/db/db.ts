import { supabaseSsl } from '@cbrl/pg'
import { createDrizzleDatabase } from '@cbrl/pg/drizzle'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from './schema'

/**
 * Postgres for imovil (Supabase in production, the local Supabase stack in
 * dev/tests): Drizzle on the `@cbrl/pg` registered pool (bounded timeouts,
 * idle-error handler, process-wide registry). Nothing opens until first use.
 *
 * Password mode only: `POSTGRES_URL` is the name the Supabase ↔ Vercel
 * integration injects (transaction pooler, port 6543). Supabase hosts are
 * verified against the pinned root CA (`supabaseSsl`), and the URL's `ssl*`
 * params are stripped so they cannot override that pin.
 *
 * `imovilDb.migrate()` applies `drizzle/`: used by the integration suite, local
 * dev and E2E; production runs `pnpm db:migrate` from CI.
 * Never call it at app boot, and never `drizzle-kit push` against production.
 */
export const imovilDb = createDrizzleDatabase({
  connectionStringEnvVar: 'POSTGRES_URL',
  database: 'imovil',
  ssl: supabaseSsl,
  schema,
  migrationsFolder: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../drizzle'),
})

export type ImovilDb = ReturnType<typeof imovilDb.db>
