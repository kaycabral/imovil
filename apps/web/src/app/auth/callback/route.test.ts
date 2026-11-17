import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

type ExchangeResult = { error: { message: string } | null }

const exchangeCodeForSession = vi.fn<(code: string) => Promise<ExchangeResult>>()
let configured = true

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: () =>
    Promise.resolve(
      configured
        ? { auth: { exchangeCodeForSession: (code: string) => exchangeCodeForSession(code) } }
        : null,
    ),
}))

function callback(query: string): Promise<Response> {
  return GET(new NextRequest(`http://localhost:3000/auth/callback${query}`))
}

describe('GET /auth/callback', () => {
  afterEach(() => {
    vi.resetAllMocks()
    vi.restoreAllMocks()
    configured = true
  })

  it('exchanges the code and lands on the safe next path', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await callback(`?code=abc&next=${encodeURIComponent('/imoveis?deal=sale')}`)

    expect(exchangeCodeForSession).toHaveBeenCalledWith('abc')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost:3000/imoveis?deal=sale')
  })

  it('defaults to /painel when next is missing', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await callback('?code=abc')

    expect(response.headers.get('location')).toBe('http://localhost:3000/painel')
  })

  it('ignores an off-site next and defaults to /painel', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null })

    const response = await callback('?code=abc&next=//evil.example.com')

    expect(response.headers.get('location')).toBe('http://localhost:3000/painel')
  })

  it('flags a login error when the exchange fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    exchangeCodeForSession.mockResolvedValue({ error: { message: 'invalid grant' } })

    const response = await callback('?code=abc&next=/painel')

    expect(response.headers.get('location')).toBe('http://localhost:3000/imoveis?login_error=1')
    expect(consoleError).toHaveBeenCalledWith('[auth] code exchange failed:', 'invalid grant')
  })

  it('flags a login error when there is no code', async () => {
    const response = await callback('?next=/painel')

    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('http://localhost:3000/imoveis?login_error=1')
  })

  it('flags a login error when Supabase is not configured', async () => {
    configured = false

    const response = await callback('?code=abc')

    expect(exchangeCodeForSession).not.toHaveBeenCalled()
    expect(response.headers.get('location')).toBe('http://localhost:3000/imoveis?login_error=1')
  })
})
