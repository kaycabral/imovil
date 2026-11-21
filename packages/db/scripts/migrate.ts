import { requireEnvOneOf } from '@cbrl/env'
import { imovilDb } from '../src/index'

/**
 * Apply `drizzle/` to `POSTGRES_URL_NON_POOLING` (preferred: session/direct URL;
 * the transaction pooler does not support the migrator's advisory lock) or
 * `POSTGRES_URL`, on a dedicated pool closed afterwards. Locally both point at
 * the Supabase stack (54322).
 */
await imovilDb.migrate({
  connectionString: requireEnvOneOf('POSTGRES_URL_NON_POOLING', 'POSTGRES_URL'),
})
process.stdout.write('imovil migrations applied\n')
