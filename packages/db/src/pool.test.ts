import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeImovilDb, getImovilDb } from './pool'

const LOCAL_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

describe('getImovilDb', () => {
  afterEach(async () => {
    await closeImovilDb()
    vi.unstubAllEnvs()
  })

  it('reuses one pool until it is closed', async () => {
    vi.stubEnv('POSTGRES_URL', LOCAL_URL)
    const first = getImovilDb()
    expect(getImovilDb()).toBe(first)
    await closeImovilDb()
    expect(getImovilDb()).not.toBe(first)
  })

  it('opens a pool for a Supabase pooler url carrying sslmode', () => {
    vi.stubEnv(
      'POSTGRES_URL',
      'postgresql://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
    )
    expect(() => getImovilDb()).not.toThrow()
  })

  it('fails fast when POSTGRES_URL is unset', () => {
    vi.stubEnv('POSTGRES_URL', '')
    expect(() => getImovilDb()).toThrow(/POSTGRES_URL/)
  })

  it('closing a never-opened pool is a no-op', async () => {
    await expect(closeImovilDb()).resolves.toBeUndefined()
  })
})
