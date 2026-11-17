import {
  closeManagedPool,
  getOrCreateManagedPoolSync,
  supabaseSsl,
  type ManagedPool,
} from '@cbrl/db'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'
import * as schema from './schema'

/**
 * Postgres connection for imovil (Supabase in production, the local Supabase
 * stack in dev/tests).
 *
 * Password mode only: `POSTGRES_URL` is the name the Supabase ↔ Vercel
 * integration injects (transaction pooler, port 6543). Supabase hosts are
 * verified against the pinned root CA (`supabaseSsl`), and `@cbrl/db` strips
 * the URL's `sslmode` so it cannot override that pin. Pool policy (timeouts,
 * idle-error handler, `globalThis` registry) comes from `@cbrl/db`.
 */
const ENV_CONFIG = {
  connectionStringEnvVar: 'POSTGRES_URL',
  iamAuthEnvVar: 'IMOVIL_USE_IAM_AUTH',
  instanceEnvVar: 'IMOVIL_CLOUDSQL_INSTANCE',
  iamUserEnvVar: 'IMOVIL_IAM_DB_USER',
  database: 'imovil',
  passwordModeSsl: supabaseSsl,
} as const

export type ImovilDb = NodePgDatabase<typeof schema>

const drizzleByPool = new WeakMap<Pool, ImovilDb>()

function dbFor(managed: ManagedPool): ImovilDb {
  const cached = drizzleByPool.get(managed.pool)
  if (cached) return cached
  const built = drizzle(managed.pool, { schema })
  drizzleByPool.set(managed.pool, built)
  return built
}

/** Drizzle client bound to the imovil schema. Lazily opens the pool. */
export function getImovilDb(): ImovilDb {
  return dbFor(getOrCreateManagedPoolSync(ENV_CONFIG))
}

/** Round-trip `select 1` — health check, and the daily keep-alive for Supabase Free. */
export async function pingImovilDb(): Promise<void> {
  await getOrCreateManagedPoolSync(ENV_CONFIG).pool.query('select 1')
}

/** Close the pool (tests / scripts). No-op if never opened. */
export async function closeImovilDb(): Promise<void> {
  await closeManagedPool(ENV_CONFIG)
}
