import { readBackend } from '@/lib/backend-read'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { getAdminAuth } from './admin'
import { SESSION_COOKIE_NAME } from './session-cookie'

// React.cache dedupa chamadas no mesmo request — layout + page compartilham 1 verificação.
export const getServerUser = cache(async (): Promise<DecodedIdToken | null> => {
  const store = await cookies()
  const cookie = store.get(SESSION_COOKIE_NAME)?.value
  if (!cookie) return null

  // Backend unavailable reads as "signed out": public pages keep rendering and
  // protected ones redirect to login instead of 500-ing.
  const result = await readBackend('session', () =>
    getAdminAuth().verifySessionCookie(cookie, true),
  )
  return result.ok ? result.data : null
})
