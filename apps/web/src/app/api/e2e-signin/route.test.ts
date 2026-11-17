import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'

type Credentials = { email: string; password: string }
type SignInResult =
  | { data: { user: { id: string } }; error: null }
  | { data: { user: null }; error: { message: string } }

const signInWithPassword = vi.fn<(credentials: Credentials) => Promise<SignInResult>>()
let configured = true

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve(
      configured
        ? {
            auth: {
              signInWithPassword: (credentials: Credentials) => signInWithPassword(credentials),
            },
          }
        : null,
    ),
}))

function post(body: unknown): Promise<Response> {
  return POST(
    new NextRequest('http://localhost:3000/api/e2e-signin', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
  )
}

const credentials: Credentials = { email: 'broker@example.com', password: 'secret' }

describe('POST /api/e2e-signin', () => {
  beforeEach(() => {
    vi.stubEnv('ENABLE_TEST_AUTH', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks()
    configured = true
  })

  it('is a 404 unless ENABLE_TEST_AUTH is exactly "true"', async () => {
    vi.stubEnv('ENABLE_TEST_AUTH', '1')

    const response = await post(credentials)

    expect(response.status).toBe(404)
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it.each([
    ['missing password', { email: 'broker@example.com' }],
    ['non-string email', { email: 1, password: 'secret' }],
    ['non-object body', 'nope'],
    ['null body', null],
  ])('rejects a bad body (%s) with 400', async (_label, body) => {
    const response = await post(body)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'email and password are required',
    })
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('is a 503 when Supabase is not configured', async () => {
    configured = false

    const response = await post(credentials)

    expect(response.status).toBe(503)
  })

  it('is a 401 with the auth error message when sign-in fails', async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    })

    const response = await post(credentials)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid login credentials' })
  })

  it('signs in and returns the user id', async () => {
    signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })

    const response = await post(credentials)

    expect(signInWithPassword).toHaveBeenCalledWith(credentials)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ userId: 'u1' })
  })
})
