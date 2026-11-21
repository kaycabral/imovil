import { coverageBase } from '@cbrl/testing/vitest'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

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
    include: ['src/**/*.test.{ts,tsx}'],
    // Unit-coverage ratchet (autoUpdate = one-way, só sobe). O seed honesto é
    // gravado pelo primeiro run com --coverage; piso anti-regressão depois.
    // Rebaixado uma vez ao adotar os pacotes @cbrl/*: o código bem testado que
    // saiu do app (auth, BR utils, safeNext) leva os testes junto pro toolkit.
    coverage: {
      ...coverageBase(),
      thresholds: {
        statements: 57.1,
        branches: 46.3,
        functions: 45.51,
        lines: 58.47,
        autoUpdate: true,
      },
    },
  },
})
