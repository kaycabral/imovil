import { coverageBase } from '@cbrl/testing/vitest'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { configDefaults, defineConfig } from 'vitest/config'

const here = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(here, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // `readBackend` lives in `@cbrl/next/server` and logs through `@cbrl/log`:
    // inlining it lets `vi.mock('@cbrl/log')` reach that import too.
    server: { deps: { inline: ['@cbrl/next'] } },
    include: ['src/**/*.test.{ts,tsx}'],
    // The Postgres suite needs the local Supabase stack: `vitest.pg.config.ts`.
    exclude: [...configDefaults.exclude, 'src/**/*.pg.test.ts'],
    // Unit-coverage ratchet (autoUpdate = one-way, só sobe). O seed honesto é
    // gravado pelo primeiro run com --coverage; piso anti-regressão depois.
    // Rebaixado uma vez ao adotar os pacotes @cbrl/*: o código bem testado que
    // saiu do app (auth, BR utils, safeNext, readBackend) leva os testes junto pro toolkit.
    coverage: {
      ...coverageBase(),
      // `src/db` is proven by the Postgres suite (`vitest.pg.config.ts`), not by
      // this one: counting its queries here would only dilute the ratchet.
      exclude: [...coverageBase().exclude, 'src/db/**'],
      thresholds: {
        statements: 59.89,
        branches: 49.06,
        functions: 48.81,
        lines: 61.12,
        autoUpdate: true,
      },
    },
  },
})
