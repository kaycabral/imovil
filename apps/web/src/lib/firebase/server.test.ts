import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const verifySessionCookie = vi.fn()
let sessionCookie: string | undefined

vi.mock('next/headers', () => ({
  cookies: () =>
    Promise.resolve({
      get: () => (sessionCookie === undefined ? undefined : { value: sessionCookie }),
    }),
}))

vi.mock('./admin', () => ({
  getAdminAuth: () => ({ verifySessionCookie }),
}))

async function loadGetServerUser() {
  vi.resetModules()
  const { getServerUser } = await import('./server')
  return getServerUser
}

describe('getServerUser', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    verifySessionCookie.mockReset()
    sessionCookie = undefined
  })

  it('returns null without a session cookie', async () => {
    const getServerUser = await loadGetServerUser()

    await expect(getServerUser()).resolves.toBeNull()
    expect(verifySessionCookie).not.toHaveBeenCalled()
  })

  it('returns the decoded token for a valid session', async () => {
    sessionCookie = 'cookie'
    verifySessionCookie.mockResolvedValue({ uid: 'uid-1' })
    const getServerUser = await loadGetServerUser()

    await expect(getServerUser()).resolves.toEqual({ uid: 'uid-1' })
    expect(verifySessionCookie).toHaveBeenCalledWith('cookie', true)
  })

  it('treats an unavailable auth backend as signed out', async () => {
    sessionCookie = 'cookie'
    verifySessionCookie.mockRejectedValue(new Error('auth backend down'))
    const getServerUser = await loadGetServerUser()

    await expect(getServerUser()).resolves.toBeNull()
  })
})
