import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const pingImovilDb = vi.fn<() => Promise<void>>()

vi.mock('@/lib/db', () => ({
  pingImovilDb: () => pingImovilDb(),
}))

describe('GET /api/health', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()
    vi.restoreAllMocks()
  })

  it('reports ok with the serving commit when the database answers', async () => {
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', 'abc123')
    pingImovilDb.mockResolvedValue(undefined)

    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      commit: 'abc123',
      database: 'ok',
    })
  })

  it('is a 503 when the database is unreachable', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubEnv('NEXT_PUBLIC_COMMIT_SHA', undefined)
    pingImovilDb.mockRejectedValue(new Error('connection refused'))

    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      status: 'error',
      commit: null,
      database: 'unreachable',
    })
    expect(consoleError).toHaveBeenCalled()
  })
})
