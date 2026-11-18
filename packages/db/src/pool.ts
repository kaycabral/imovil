import { requireEnv } from '@imovil/env'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool, type PoolConfig } from 'pg'
import * as schema from './schema'
import { stripSslParams, supabaseSsl } from './supabase'

/**
 * Postgres connection for imovil (Supabase in production, the local Supabase
 * stack in dev/tests).
 *
 * Password mode only: `POSTGRES_URL` is the name the Supabase ↔ Vercel
 * integration injects (transaction pooler, port 6543). Supabase hosts are
 * verified against the pinned root CA (`supabaseSsl`), and the URL's `ssl*`
 * params are stripped so they cannot override that pin (`pg` lets
 * connection-string params win over the `ssl` object).
 */

const CONNECTION_STRING_ENV = 'POSTGRES_URL'
const DATABASE = 'imovil'

const POOL_MAX = 5
const POOL_IDLE_MS = 600_000

/**
 * Defensive timeouts: without them a single stalled connection (half-open socket
 * after a `57P01`, a query blocked under load) is never reclaimed and, with
 * `max: 5`, a few zombies freeze every later query. Each bound makes a stuck
 * connection fail fast and self-heal instead of wedging the pool.
 */
const POOL_TUNING = {
  connectionTimeoutMillis: 10_000,
  statement_timeout: 30_000,
  query_timeout: 30_000,
  idle_in_transaction_session_timeout: 15_000,
  keepAlive: true,
} as const satisfies Partial<PoolConfig>

/**
 * `pg` emits `'error'` on the Pool when an IDLE client's connection drops server
 * side (Supabase recycling a connection, the local stack torn down). With no
 * listener Node escalates it to an `uncaughtException` and kills the process.
 * The pool already discards the failed client, so log and swallow.
 */
function attachPoolErrorHandler(pool: Pool): Pool {
  pool.on('error', (err) => {
    const code = 'code' in err && typeof err.code === 'string' ? err.code : undefined
    console.error(
      JSON.stringify({
        level: 'error',
        event: 'pg_pool_idle_client_error',
        database: DATABASE,
        message: err.message,
        code,
      }),
    )
  })
  return pool
}

function createPool(): Pool {
  const rawConnectionString = requireEnv(CONNECTION_STRING_ENV)
  const ssl = supabaseSsl(rawConnectionString)
  const connectionString =
    ssl === undefined ? rawConnectionString : stripSslParams(rawConnectionString)
  return attachPoolErrorHandler(
    new Pool({
      connectionString,
      ...(ssl === undefined ? {} : { ssl }),
      max: POOL_MAX,
      idleTimeoutMillis: POOL_IDLE_MS,
      ...POOL_TUNING,
    }),
  )
}

/**
 * Process-wide pool slot on `globalThis`: under the Next build, Turbopack can
 * load separate copies of this module per entry chunk, and a module-level `let`
 * would open one pool per copy. `globalThis` is a true per-process singleton.
 */
const POOL_KEY = Symbol.for('@imovil/db.pool')

type PoolSlot = { [POOL_KEY]?: Pool }

function slot(): PoolSlot {
  return globalThis as typeof globalThis & PoolSlot
}

function getPool(): Pool {
  const g = slot()
  return (g[POOL_KEY] ??= createPool())
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
  const g = slot()
  const pool = g[POOL_KEY]
  if (!pool) return
  delete g[POOL_KEY]
  await pool.end()
}
