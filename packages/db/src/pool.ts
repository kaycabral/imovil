import {
  closeManagedPool,
  getOrCreateManagedPoolSync,
  supabaseSsl,
  type PoolEnvConfig,
} from '@cbrl/pg'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import type { Pool } from 'pg'
import * as schema from './schema'

/**
 * Postgres connection for imovil (Supabase in production, the local Supabase
 * stack in dev/tests), opened through `@cbrl/pg` (bounded timeouts, idle-error
 * handler, process-wide registry).
 *
 * Password mode only: `POSTGRES_URL` is the name the Supabase ↔ Vercel
 * integration injects (transaction pooler, port 6543). Supabase hosts are
 * verified against the pinned root CA (`supabaseSsl`), and the URL's `ssl*`
 * params are stripped so they cannot override that pin.
 */
const POOL_CONFIG: PoolEnvConfig = {
  connectionStringEnvVar: 'POSTGRES_URL',
  database: 'imovil',
  passwordModeSsl: supabaseSsl,
}

function getPool(): Pool {
  return getOrCreateManagedPoolSync(POOL_CONFIG).pool
}

export type ImovilDb = NodePgDatabase<typeof schema>

const drizzleByPool = new WeakMap<Pool, ImovilDb>()

/** Drizzle client bound to the imovil schema. Lazily opens the pool. */
export function getImovilDb(): ImovilDb {
  const pool = getPool()
  const cached = drizzleByPool.get(pool)
  if (cached) return cached
  const built = drizzle(pool, { schema })
  drizzleByPool.set(pool, built)
  return built
}

/** Round-trip `select 1` — health check, and the daily keep-alive for Supabase Free. */
export async function pingImovilDb(): Promise<void> {
  await getPool().query('select 1')
}

/** Close the pool (tests / scripts). No-op if never opened. */
export async function closeImovilDb(): Promise<void> {
  await closeManagedPool(POOL_CONFIG)
}
