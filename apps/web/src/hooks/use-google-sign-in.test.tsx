import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useGoogleSignIn } from './use-google-sign-in'

type OAuthOptions = { provider: 'google'; options: { redirectTo: string } }
type OAuthResult = { error: { message: string } | null }

let pathname = '/imoveis'
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useSearchParams: () => searchParams,
}))

const signInWithOAuth = vi.fn<(options: OAuthOptions) => Promise<OAuthResult>>()
let clientConfigured = true

vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () =>
    clientConfigured
      ? { auth: { signInWithOAuth: (options: OAuthOptions) => signInWithOAuth(options) } }
      : null,
}))

const toastError = vi.fn<(message: string) => void>()
vi.mock('sonner', () => ({
  toast: {
    error: (message: string) => {
      toastError(message)
    },
    success: vi.fn(),
  },
}))

function expectedRedirect(next: string): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
}

async function signInAndGetRedirect(): Promise<string> {
  const { result } = renderHook(() => useGoogleSignIn())
  await act(() => result.current.signIn())
  expect(signInWithOAuth).toHaveBeenCalledTimes(1)
  const [call] = signInWithOAuth.mock.calls[0]!
  expect(call.provider).toBe('google')
  return call.options.redirectTo
}

describe('useGoogleSignIn', () => {
  beforeEach(() => {
    signInWithOAuth.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.resetAllMocks()
    pathname = '/imoveis'
    searchParams = new URLSearchParams()
    clientConfigured = true
  })

  it('does not start OAuth when Supabase is not configured', async () => {
    clientConfigured = false

    const { result } = renderHook(() => useGoogleSignIn())
    await act(() => result.current.signIn())

    expect(signInWithOAuth).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('Login indisponível'))
    expect(result.current.loading).toBe(false)
  })

  it('returns to the safe next param through /auth/callback', async () => {
    searchParams = new URLSearchParams({ next: '/painel/imoveis?status=draft' })

    await expect(signInAndGetRedirect()).resolves.toBe(
      expectedRedirect('/painel/imoveis?status=draft'),
    )
  })

  it('falls back to the current path without the auth params', async () => {
    pathname = '/imoveis'
    searchParams = new URLSearchParams({ login: '1', login_error: '1', deal: 'sale', page: '2' })

    await expect(signInAndGetRedirect()).resolves.toBe(
      expectedRedirect('/imoveis?deal=sale&page=2'),
    )
  })

  it('uses the bare pathname when only auth params are present', async () => {
    pathname = '/novidades'
    searchParams = new URLSearchParams({ login: '1' })

    await expect(signInAndGetRedirect()).resolves.toBe(expectedRedirect('/novidades'))
  })

  it('rejects unsafe next params (protocol-relative) and falls back to the current path', async () => {
    pathname = '/imoveis'
    searchParams = new URLSearchParams({ next: '//evil.example.com', deal: 'rental' })

    await expect(signInAndGetRedirect()).resolves.toBe(expectedRedirect('/imoveis?deal=rental'))
  })

  it('keeps loading after a successful start and ignores repeated clicks', async () => {
    const { result } = renderHook(() => useGoogleSignIn())
    await act(() => result.current.signIn())

    await waitFor(() => expect(result.current.loading).toBe(true))
    await act(() => result.current.signIn())

    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
    expect(toastError).not.toHaveBeenCalled()
  })

  it('toasts and resets loading when signInWithOAuth returns an error', async () => {
    signInWithOAuth.mockResolvedValue({ error: { message: 'provider disabled' } })

    const { result } = renderHook(() => useGoogleSignIn())
    await act(() => result.current.signIn())

    expect(toastError).toHaveBeenCalledWith('Não foi possível entrar com o Google. Tenta de novo.')
    expect(result.current.loading).toBe(false)
  })
})
