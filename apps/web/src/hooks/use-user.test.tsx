import { renderHook, waitFor } from '@testing-library/react'
import { onAuthStateChanged } from 'firebase/auth'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useUser } from './use-user'

let firebaseConfigured = true

vi.mock('@/lib/firebase/client', () => ({
  getClientAuth: () => ({}),
  isClientFirebaseConfigured: () => firebaseConfigured,
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
}))

describe('useUser', () => {
  afterEach(() => {
    vi.clearAllMocks()
    firebaseConfigured = true
  })

  it('reports signed out without touching Firebase when it is not configured', () => {
    firebaseConfigured = false

    const { result } = renderHook(() => useUser())

    expect(result.current).toEqual({ user: null, loading: false })
    expect(onAuthStateChanged).not.toHaveBeenCalled()
  })

  it('subscribes to auth state when Firebase is configured', async () => {
    const unsubscribe = vi.fn()
    vi.mocked(onAuthStateChanged).mockImplementation((_auth, next) => {
      if (typeof next === 'function') next(null)
      return unsubscribe
    })

    const { result, unmount } = renderHook(() => useUser())

    await waitFor(() => expect(result.current.loading).toBe(false))
    unmount()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
