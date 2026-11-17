import { afterEach, describe, expect, it, vi } from 'vitest'
import { supabasePublicConfig } from './config'

describe('supabasePublicConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns url + publishable key when both are set', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_123')

    expect(supabasePublicConfig()).toEqual({
      url: 'https://project.supabase.co',
      key: 'sb_publishable_123',
    })
  })

  it('returns null when the url is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_123')

    expect(supabasePublicConfig()).toBeNull()
  })

  it('returns null when the key is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')

    expect(supabasePublicConfig()).toBeNull()
  })
})
