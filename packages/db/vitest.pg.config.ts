import { defineConfig } from 'vitest/config'

// Postgres integration suite: runs against a REAL database from
// `POSTGRES_URL` (the local Supabase stack — it ships the `auth` and `storage`
// schemas the migrations reference)
// so constraints are proven natively. Files share one database and truncate
// between tests, hence no file parallelism.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.pg.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
