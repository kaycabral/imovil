import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getServerTemplate = vi.fn()

vi.mock('@imovil/db', () => ({
  getAdminRemoteConfig: () => ({ getServerTemplate }),
}))

async function loadGetFeatures() {
  vi.resetModules()
  const { getFeatures } = await import('./features')
  return getFeatures
}

describe('getFeatures', () => {
  beforeEach(() => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', '')
    vi.stubEnv('FIREBASE_AUTH_EMULATOR_HOST', '')
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    getServerTemplate.mockReset()
  })

  it('returns defaults without calling Remote Config under the emulator', async () => {
    vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8080')
    const getFeatures = await loadGetFeatures()

    await expect(getFeatures()).resolves.toEqual({ leads: false })
    expect(getServerTemplate).not.toHaveBeenCalled()
  })

  it('evaluates the Remote Config template', async () => {
    getServerTemplate.mockResolvedValue({
      evaluate: () => ({ getBoolean: (key: string) => key === 'feature_leads' }),
    })
    const getFeatures = await loadGetFeatures()

    await expect(getFeatures()).resolves.toEqual({ leads: true })
  })

  it('falls back to defaults when Remote Config is unavailable', async () => {
    getServerTemplate.mockRejectedValue(new Error('no credentials'))
    const getFeatures = await loadGetFeatures()

    await expect(getFeatures()).resolves.toEqual({ leads: false })
  })
})
