import { AuthApiError, AuthSessionMissingError } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getServerUser } from './server'

type Claims = { sub: string; email?: string; user_metadata?: Record<string, unknown> }
type ClaimsResult = { data: { claims: Claims } | null; error: Error | null }

// `server-only` throws outside a React Server Component bundle.
vi.mock('server-only', () => ({}))

const getClaims = vi.fn<() => Promise<ClaimsResult>>()
let configured = true

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve(configured ? { auth: { getClaims: () => getClaims() } } : null),
}))

describe('getServerUser', () => {
  afterEach(() => {
    vi.resetAllMocks()
    vi.restoreAllMocks()
    configured = true
  })

  it('returns null without Supabase config', async () => {
    configured = false

    await expect(getServerUser()).resolves.toBeNull()
    expect(getClaims).not.toHaveBeenCalled()
  })

  it('maps verified JWT claims to SessionUser', async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: 'u1',
          email: 'ana@example.com',
          user_metadata: { full_name: 'Ana Souza', avatar_url: 'https://example.com/a.png' },
        },
      },
      error: null,
    })

    await expect(getServerUser()).resolves.toEqual({
      id: 'u1',
      email: 'ana@example.com',
      name: 'Ana Souza',
      avatarUrl: 'https://example.com/a.png',
    })
  })

  it('returns null when there are no claims (anonymous request)', async () => {
    getClaims.mockResolvedValue({ data: null, error: null })

    await expect(getServerUser()).resolves.toBeNull()
  })

  it('treats a missing session as signed out without logging', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    getClaims.mockResolvedValue({ data: null, error: new AuthSessionMissingError() })

    await expect(getServerUser()).resolves.toBeNull()
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('returns null (and logs) when Supabase Auth fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    getClaims.mockResolvedValue({
      data: null,
      error: new AuthApiError('upstream down', 503, 'unexpected_failure'),
    })

    await expect(getServerUser()).resolves.toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      '[backend] session unavailable:',
      expect.any(AuthApiError),
    )
  })
})
