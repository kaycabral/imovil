import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const here = path.dirname(fileURLToPath(import.meta.url))

// Postgres integration suite: runs against a REAL database from
// `POSTGRES_URL` (the local Supabase stack — it ships the `auth` and `storage`
// schemas the migrations reference)
// so constraints are proven natively. Files share one database and truncate
// between tests, hence no file parallelism.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(here, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/db/**/*.pg.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    fileParallelism: false,
  },
})
