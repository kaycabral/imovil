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
    coverage: {
      ...coverageBase(),
      thresholds: {
        statements: 54.96,
        branches: 46.03,
        functions: 43.95,
        lines: 56.12,
        autoUpdate: true,
      },
    },
  },
})
