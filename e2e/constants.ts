import path from 'node:path'

// Single source for the dev port: the `dev` script runs `next dev -p 3003`, so
// playwright.config (baseURL + webServer url) and the worker auth fixture all
// derive from it — no drift.
export const E2E_PORT = 3003
export const BASE_URL = `http://127.0.0.1:${E2E_PORT}`

// The broker account is created per parallel worker in `fixtures.ts`
// (`broker-w<workerIndex>@e2e.test`); only the shared display name lives here.
export const BROKER_DISPLAY_NAME = 'Broker E2E'

// Resolves from the repo root (Playwright's cwd when invoked via `pnpm test:e2e`).
export const TEST_IMAGE = path.resolve(process.cwd(), 'e2e/test-data/foto.jpg')
