import { afterEach, describe, expect, it, vi } from 'vitest'
import { getFeatures } from './features'

describe('getFeatures', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('keeps leads off when the flag is unset', () => {
    vi.stubEnv('IMOVIL_FEATURE_LEADS', '')
    expect(getFeatures()).toEqual({ leads: false })
  })

  it('turns leads on from the env flag', () => {
    vi.stubEnv('IMOVIL_FEATURE_LEADS', 'true')
    expect(getFeatures()).toEqual({ leads: true })
  })
})
