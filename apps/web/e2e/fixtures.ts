import path from 'node:path'

import { authEmulatorHost } from '@cbrl/testing/firebase'
import { getAdminAuth } from '@imovil/db'
import { test as base, expect } from '@playwright/test'

import { BASE_URL, BROKER_DISPLAY_NAME } from './constants'
import {
  seedProfile,
  seedProperty as seedPropertyRaw,
  type SeededProperty,
  type SeedPropertyInput,
} from './seed'

export type SeededWithTitle = SeededProperty & { title: string }
// ownerUid is optional here — it defaults to this worker's broker.
export type SeedPropertyFn = (
  input?: Omit<SeedPropertyInput, 'ownerUid'> & { ownerUid?: string },
) => Promise<SeededWithTitle>

const API_KEY = 'ci-local'

type WorkerFixtures = {
  // One broker account per parallel worker. The painel list each worker sees
  // holds only its own broker's properties, so parallel workers never race on a
  // shared global list (Playwright's one-account-per-worker pattern). Tests
  // within a worker run serially, so there's no intra-worker race either.
  brokerUid: string
  brokerStorageState: string
}

type TestFixtures = {
  // Opt-in (per `test.use`): run the test authenticated as the worker's broker.
  authAsBroker: boolean
  broker: { uid: string }
  // Seeds a property owned by the worker's broker (override via `ownerUid`),
  // with a per-test-unique title so parallel workers never collide. Assert on
  // the returned `title`/`slug`, never a hard-coded string.
  seedProperty: SeedPropertyFn
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  brokerUid: [
    async ({}, use, workerInfo) => {
      const uid = `e2ebroker-w${workerInfo.workerIndex}`
      const auth = getAdminAuth()
      try {
        await auth.deleteUser(uid)
      } catch {
        // didn't exist — fine
      }
      await auth.createUser({
        uid,
        email: `broker-w${workerInfo.workerIndex}@e2e.test`,
        displayName: BROKER_DISPLAY_NAME,
        emailVerified: true,
      })
      await seedProfile(uid)
      await use(uid)
    },
    { scope: 'worker' },
  ],

  brokerStorageState: [
    async ({ browser, brokerUid }, use, workerInfo) => {
      const file = path.resolve(process.cwd(), 'e2e/.auth', `broker-${workerInfo.workerIndex}.json`)
      const customToken = await getAdminAuth().createCustomToken(brokerUid)

      const res = await fetch(
        `http://${authEmulatorHost()}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        },
      )
      if (!res.ok) {
        throw new Error(`signInWithCustomToken failed: ${res.status} ${await res.text()}`)
      }
      const { idToken } = (await res.json()) as { idToken: string }

      const context = await browser.newContext({ baseURL: BASE_URL })
      const page = await context.newPage()
      const sessionRes = await page.request.post('/api/auth/session', { data: { idToken } })
      expect(sessionRes.ok(), `POST /api/auth/session failed: ${sessionRes.status()}`).toBeTruthy()
      // Client SDK sign-in so getClientAuth().currentUser is set (IndexedDB).
      await page.goto(`/api/e2e-signin?token=${encodeURIComponent(customToken)}`)
      await expect(page.getByTestId('sign-in-status')).toHaveText('done', { timeout: 15_000 })
      await context.storageState({ path: file, indexedDB: true })
      await context.close()
      await use(file)
    },
    { scope: 'worker' },
  ],

  authAsBroker: [false, { option: true }],

  storageState: async ({ authAsBroker, brokerStorageState }, use) => {
    await use(authAsBroker ? brokerStorageState : undefined)
  },

  broker: async ({ brokerUid }, use) => {
    await use({ uid: brokerUid })
  },

  seedProperty: async ({ brokerUid }, use, testInfo) => {
    const tag = testInfo.testId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)
    let seq = 0
    await use(async (input = {}) => {
      seq += 1
      const baseTitle = input.overrides?.title ?? 'Imóvel'
      const title = `${baseTitle} ${tag}-${seq}`
      const res = await seedPropertyRaw({
        ownerUid: brokerUid,
        ...input,
        overrides: { ...input.overrides, title },
      })
      return { ...res, title }
    })
  },
})

export { expect }
