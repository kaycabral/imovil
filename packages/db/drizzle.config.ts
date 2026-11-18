import { requireEnvOneOf } from '@cbrl/env'
import { stripSslParams, supabaseSsl } from '@cbrl/pg'
import { defineConfig } from 'drizzle-kit'

/**
 * drizzle-kit config for imovil's Postgres (Supabase).
 *
 * `generate` writes versioned SQL migrations into `drizzle/` (reviewed in the
 * MR); `migrate` applies them. It prefers `POSTGRES_URL_NON_POOLING` (session /
 * direct URL from the Supabase ↔ Vercel integration): the transaction pooler in
 * `POSTGRES_URL` does not support the migrator's session-level advisory lock.
 * Only the `public` schema is managed here; `auth` and `storage` belong to
 * Supabase (the custom migration only adds a trigger, a bucket and policies).
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  schemaFilter: ['public'],
  dbCredentials: (() => {
    const url = requireEnvOneOf('POSTGRES_URL_NON_POOLING', 'POSTGRES_URL')
    const ssl = supabaseSsl(url)
    return ssl ? { url: stripSslParams(url), ssl } : { url }
  })(),
  strict: true,
  verbose: true,
})
