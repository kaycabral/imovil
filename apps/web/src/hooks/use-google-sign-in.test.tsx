import { renderHook, waitFor } from '@testing-library/react'
import { signInWithPopup, type User, type UserCredential } from 'firebase/auth'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useGoogleSignIn } from './use-google-sign-in'

// Factory: produz User completo, type-safe, sem cast.
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'mock-uid',
    email: 'mock@example.com',
    emailVerified: true,
    displayName: 'Mock User',
    photoURL: null,
    phoneNumber: null,
    providerId: 'firebase',
    isAnonymous: false,
    metadata: { creationTime: '', lastSignInTime: '' },
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: vi.fn().mockResolvedValue(undefined),
    getIdToken: vi.fn().mockResolvedValue('id-token'),
    getIdTokenResult: vi.fn().mockResolvedValue({
      token: 'id-token',
      expirationTime: '',
      authTime: '',
      issuedAtTime: '',
      signInProvider: null,
      signInSecondFactor: null,
      claims: {},
    }),
    reload: vi.fn().mockResolvedValue(undefined),
    toJSON: vi.fn().mockReturnValue({}),
    ...overrides,
  }
}

function createMockUserCredential(overrides: Partial<UserCredential> = {}): UserCredential {
  return {
    user: createMockUser(),
    providerId: 'google.com',
    operationType: 'signIn',
    ...overrides,
  }
}

const routerPush = vi.fn()
const routerRefresh = vi.fn()
let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
  useSearchParams: () => searchParams,
}))

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}))

let firebaseConfigured = true

vi.mock('@/lib/firebase/client', () => ({
  getClientAuth: () => ({}),
  isClientFirebaseConfigured: () => firebaseConfigured,
}))

const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => {
      toastError(...args)
    },
    success: vi.fn(),
  },
}))

describe('useGoogleSignIn', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    searchParams = new URLSearchParams()
    firebaseConfigured = true
  })

  it('does not open the popup when Firebase is not configured', async () => {
    firebaseConfigured = false

    const { result } = renderHook(() => useGoogleSignIn())
    await result.current.signIn()

    expect(signInWithPopup).not.toHaveBeenCalled()
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('Login indisponível'))
  })

  it('refreshes the router when no next param is set', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue(createMockUserCredential())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    const { result } = renderHook(() => useGoogleSignIn())
    await result.current.signIn()

    await waitFor(() => expect(routerRefresh).toHaveBeenCalled())
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('navigates to next when present and safe', async () => {
    searchParams = new URLSearchParams({ next: '/painel' })
    vi.mocked(signInWithPopup).mockResolvedValue(createMockUserCredential())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    const { result } = renderHook(() => useGoogleSignIn())
    await result.current.signIn()

    await waitFor(() => expect(routerPush).toHaveBeenCalledWith('/painel'))
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it('rejects unsafe next params (external or protocol-relative)', async () => {
    searchParams = new URLSearchParams({ next: '//evil.example.com' })
    vi.mocked(signInWithPopup).mockResolvedValue(createMockUserCredential())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))

    const { result } = renderHook(() => useGoogleSignIn())
    await result.current.signIn()

    await waitFor(() => expect(routerRefresh).toHaveBeenCalled())
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('surfaces status and body when /api/auth/session returns non-ok', async () => {
    vi.mocked(signInWithPopup).mockResolvedValue(createMockUserCredential())
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        text: () => Promise.resolve('upstream down'),
      }),
    )

    const { result } = renderHook(() => useGoogleSignIn())
    await result.current.signIn()

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(expect.stringContaining('status=502')),
    )
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('upstream down'))
  })
})
