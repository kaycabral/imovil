import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUser } from './use-user'

type FakeSession = {
  user: { id: string; email?: string; user_metadata: Record<string, unknown> }
}
type AuthListener = (event: string, session: FakeSession | null) => void

let configured = true
let listener: AuthListener | null = null
const unsubscribe = vi.fn()
const onAuthStateChange = vi.fn((callback: AuthListener) => {
  listener = callback
  return { data: { subscription: { unsubscribe } } }
})

vi.mock('@cbrl/supabase/client', () => ({
  getSupabaseBrowserClient: () =>
    configured
      ? { auth: { onAuthStateChange: (callback: AuthListener) => onAuthStateChange(callback) } }
      : null,
}))

function emit(event: string, session: FakeSession | null) {
  if (!listener) throw new Error('no auth listener registered')
  const notify = listener
  act(() => notify(event, session))
}

describe('useUser', () => {
  // Reset before (not after) each test: RTL unmounts the previous hook in its own
  // afterEach, which would otherwise count toward the next test's unsubscribe.
  beforeEach(() => {
    vi.clearAllMocks()
    configured = true
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_123')
    listener = null
  })

  it('reports signed out without touching the SDK when Supabase is not configured', () => {
    configured = false
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')

    const { result } = renderHook(() => useUser())

    expect(result.current).toEqual({ user: null, loading: false })
    expect(onAuthStateChange).not.toHaveBeenCalled()
  })

  it('starts loading until the initial session arrives', () => {
    const { result } = renderHook(() => useUser())

    expect(result.current).toEqual({ user: null, loading: true })
    expect(onAuthStateChange).toHaveBeenCalledOnce()
  })

  it('maps the session user (Google metadata) to SessionUser', () => {
    const { result } = renderHook(() => useUser())

    emit('INITIAL_SESSION', {
      user: {
        id: 'u1',
        email: 'ana@example.com',
        user_metadata: { full_name: 'Ana Souza', avatar_url: 'https://example.com/a.png' },
      },
    })

    expect(result.current).toEqual({
      user: {
        id: 'u1',
        email: 'ana@example.com',
        name: 'Ana Souza',
        avatarUrl: 'https://example.com/a.png',
        emailVerified: false,
        appMetadata: {},
      },
      loading: false,
    })
  })

  it('reports signed out when the session ends', () => {
    const { result } = renderHook(() => useUser())

    emit('INITIAL_SESSION', { user: { id: 'u1', user_metadata: {} } })
    expect(result.current.user).toMatchObject({
      id: 'u1',
      email: null,
      name: null,
      avatarUrl: null,
    })

    emit('SIGNED_OUT', null)
    expect(result.current).toEqual({ user: null, loading: false })
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useUser())

    unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
