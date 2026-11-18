import { randomBytes } from 'node:crypto'
import path from 'node:path'

import { test as base, expect } from '@playwright/test'

import { BASE_URL, BROKER_DISPLAY_NAME } from './constants'
import {
  recreateAuthUser,
  seedProfile,
  seedProperty as seedPropertyRaw,
  type SeededProperty,
  type SeedPropertyInput,
} from './seed'

export type SeededWithTitle = SeededProperty & { title: string }
// ownerId is optional here — it defaults to this worker's broker.
export type SeedPropertyFn = (
  input?: Omit<SeedPropertyInput, 'ownerId'> & { ownerId?: string },
) => Promise<SeededWithTitle>

const BROKER_PASSWORD = 'e2e-broker-password'

function brokerEmail(workerIndex: number): string {
  return `broker-w${workerIndex}@e2e.test`
}

type WorkerFixtures = {
  // One broker account per parallel worker. The painel list each worker sees
  // holds only its own broker's properties, so parallel workers never race on a
  // shared global list (Playwright's one-account-per-worker pattern). Tests
  // within a worker run serially, so there's no intra-worker race either.
  brokerId: string
  brokerStorageState: string
}

type TestFixtures = {
  // Opt-in (per `test.use`): run the test authenticated as the worker's broker.
  authAsBroker: boolean
  broker: { id: string }
  // Seeds a property owned by the worker's broker (override via `ownerId`),
  // with a per-test-unique title so parallel workers never collide. Assert on
  // the returned `title`/`slug`, never a hard-coded string.
  seedProperty: SeedPropertyFn
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  brokerId: [
    async ({}, use, workerInfo) => {
      const id = await recreateAuthUser({
        email: brokerEmail(workerInfo.workerIndex),
        password: BROKER_PASSWORD,
        displayName: BROKER_DISPLAY_NAME,
      })
      await seedProfile(id)
      await use(id)
    },
    { scope: 'worker' },
  ],

  brokerStorageState: [
    async ({ browser, brokerId }, use, workerInfo) => {
      const file = path.resolve(process.cwd(), 'e2e/.auth', `broker-${workerInfo.workerIndex}.json`)
      const context = await browser.newContext({ baseURL: BASE_URL })
      // The test-only route signs in with the Supabase server client, which
      // writes the real session cookies into this context.
      const res = await context.request.post('/api/e2e-signin', {
        data: { email: brokerEmail(workerInfo.workerIndex), password: BROKER_PASSWORD },
      })
      expect(res.ok(), `POST /api/e2e-signin failed: ${res.status()}`).toBeTruthy()
      expect(await res.json()).toEqual({ userId: brokerId })
      await context.storageState({ path: file })
      await context.close()
      await use(file)
    },
    // The first request compiles the route in `next dev`; give it room.
    { scope: 'worker', timeout: 60_000 },
  ],

  authAsBroker: [false, { option: true }],

  storageState: async ({ authAsBroker, brokerStorageState }, use) => {
    await use(authAsBroker ? brokerStorageState : undefined)
  },

  broker: async ({ brokerId }, use) => {
    await use({ id: brokerId })
  },

  seedProperty: async ({ brokerId }, use, testInfo) => {
    // testId alone is stable across runs and the suite never wipes the shared
    // database, so a leftover row from an earlier run (e.g. a broker orphaned
    // when a worker restarted after a failure) would duplicate the title. The
    // random suffix makes every run's titles unique.
    const tag = `${testInfo.testId.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}${randomBytes(3).toString('hex')}`
    let seq = 0
    await use(async (input = {}) => {
      seq += 1
      const baseTitle = input.overrides?.title ?? 'Imóvel'
      const title = `${baseTitle} ${tag}-${seq}`
      const res = await seedPropertyRaw({
        ownerId: brokerId,
        ...input,
        overrides: { ...input.overrides, title },
      })
      return { ...res, title }
    })
  },
})

export { expect }
