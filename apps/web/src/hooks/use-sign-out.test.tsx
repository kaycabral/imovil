import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useSignOut } from './use-sign-out'

const calls: string[] = []

const push = vi.fn((href: string) => {
  calls.push(`push:${href}`)
})
const refresh = vi.fn(() => {
  calls.push('refresh')
})
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}))

const signOut = vi.fn(() => {
  calls.push('signOut')
  return Promise.resolve({ error: null })
})
let clientConfigured = true
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => (clientConfigured ? { auth: { signOut } } : null),
}))

const clearAllDrafts = vi.fn(() => {
  calls.push('clearAllDrafts')
})
vi.mock('@/app/painel/imoveis/_hooks/property-draft-storage', () => ({
  clearAllDrafts: () => {
    clearAllDrafts()
  },
}))

describe('useSignOut', () => {
  afterEach(() => {
    vi.clearAllMocks()
    calls.length = 0
    clientConfigured = true
  })

  it('ends the session, wipes property drafts (LGPD) and returns to the public listing', async () => {
    const { result } = renderHook(() => useSignOut())

    await act(() => result.current())

    expect(calls).toEqual(['signOut', 'clearAllDrafts', 'push:/imoveis', 'refresh'])
  })

  it('still wipes drafts and redirects when Supabase is not configured', async () => {
    clientConfigured = false
    const { result } = renderHook(() => useSignOut())

    await act(() => result.current())

    expect(signOut).not.toHaveBeenCalled()
    expect(calls).toEqual(['clearAllDrafts', 'push:/imoveis', 'refresh'])
  })
})
