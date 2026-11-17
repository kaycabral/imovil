import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertLocalDatabase } from './seed'

describe('assertLocalDatabase', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(['localhost', '127.0.0.1', 'postgres'])('accepts the local host %s', (host) => {
    vi.stubEnv('POSTGRES_URL', `postgresql://postgres:postgres@${host}:54322/postgres`)
    expect(() => assertLocalDatabase()).not.toThrow()
  })

  it('refuses a Supabase host', () => {
    vi.stubEnv('POSTGRES_URL', 'postgresql://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres')
    expect(() => assertLocalDatabase()).toThrow(/non-local database/)
  })

  it('refuses when POSTGRES_URL is unset', () => {
    vi.stubEnv('POSTGRES_URL', '')
    expect(() => assertLocalDatabase()).toThrow(/\(unset\)/)
  })
})
