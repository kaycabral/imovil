import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

export type LocalSupabase = {
  apiUrl: string
  publishableKey: string
  secretKey: string
  dbUrl: string
}

/** apps/web, found by walking up from the cwd to the dir that holds `supabase/config.toml`. */
export function imovilAppDir(): string {
  for (let dir = process.cwd(); ; dir = path.dirname(dir)) {
    if (existsSync(path.join(dir, 'supabase', 'config.toml'))) return dir
    if (path.dirname(dir) === dir) throw new Error('supabase/config.toml not found above cwd')
  }
}

function field(status: Record<string, unknown>, key: string): string {
  const value = status[key]
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(
      `supabase status: missing ${key}. Is the local stack up? Run \`pnpm db:start\`.`,
    )
  }
  return value
}

/**
 * URL, keys and database of the LOCAL Supabase stack (`pnpm db:start`), read
 * from `supabase status` so nothing is hard-coded. Only ever local values: the
 * stack's keys are generated per machine and never reach production.
 */
export function readLocalSupabase(): LocalSupabase {
  const raw = execFileSync('pnpm', ['exec', 'supabase', 'status', '-o', 'json', '--workdir', '.'], {
    cwd: imovilAppDir(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const status: unknown = JSON.parse(raw)
  if (typeof status !== 'object' || status === null) {
    throw new Error('supabase status: unexpected output')
  }
  const record = Object.fromEntries(Object.entries(status))
  return {
    apiUrl: field(record, 'API_URL'),
    publishableKey: field(record, 'PUBLISHABLE_KEY'),
    secretKey: field(record, 'SECRET_KEY'),
    dbUrl: field(record, 'DB_URL'),
  }
}
