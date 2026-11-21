import { drizzleKitCredentials } from '@cbrl/pg/drizzle'
import { defineConfig } from 'drizzle-kit'

/**
 * drizzle-kit config for imovil's Postgres (Supabase).
 *
 * `generate` writes versioned SQL migrations into `drizzle/` (reviewed in the
 * MR); `migrate` applies them. It prefers `POSTGRES_URL_NON_POOLING` (session /
 * direct URL from the Supabase ↔ Vercel integration): the transaction pooler in
 * `POSTGRES_URL` does not support the migrator's session-level advisory lock.
 * Supabase hosts get the pinned root CA. Only the `public` schema is managed
 * here; `auth` and `storage` belong to Supabase (the custom migration only adds
 * a trigger, a bucket and policies).
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  schemaFilter: ['public'],
  dbCredentials: drizzleKitCredentials('POSTGRES_URL_NON_POOLING', 'POSTGRES_URL'),
  strict: true,
  verbose: true,
})
