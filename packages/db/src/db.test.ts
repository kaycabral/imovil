import { afterEach, describe, expect, it, vi } from 'vitest'
import { imovilDb } from './db'

const LOCAL_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

describe('imovilDb', () => {
  afterEach(async () => {
    await imovilDb.close()
    vi.unstubAllEnvs()
  })

  it('reuses one client until the pool is closed', async () => {
    vi.stubEnv('POSTGRES_URL', LOCAL_URL)
    const first = imovilDb.db()
    expect(imovilDb.db()).toBe(first)
    await imovilDb.close()
    expect(imovilDb.db()).not.toBe(first)
  })

  it('opens a pool for a Supabase pooler url carrying sslmode', () => {
    vi.stubEnv(
      'POSTGRES_URL',
      'postgresql://u:p@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
    )
    expect(() => imovilDb.db()).not.toThrow()
  })

  it('fails fast when POSTGRES_URL is unset', () => {
    vi.stubEnv('POSTGRES_URL', '')
    expect(() => imovilDb.db()).toThrow(/POSTGRES_URL/)
  })
})
