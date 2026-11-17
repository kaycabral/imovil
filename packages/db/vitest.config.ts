import { configDefaults, defineConfig } from 'vitest/config'

// Unit suite (pure helpers). The Postgres suite (`*.pg.test.ts`) needs the local
// Supabase stack and runs through `vitest.pg.config.ts` instead.
export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'src/**/*.pg.test.ts'],
  },
})
