import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadIsConfigured() {
  vi.resetModules()
  const { isClientFirebaseConfigured } = await import('./client')
  return isClientFirebaseConfigured
}

describe('isClientFirebaseConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is false without the public Firebase web config', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', '')
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', '')

    expect((await loadIsConfigured())()).toBe(false)
  })

  it('is true when api key and project id are set', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'demo')
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'imovil-local')

    expect((await loadIsConfigured())()).toBe(true)
  })
})
