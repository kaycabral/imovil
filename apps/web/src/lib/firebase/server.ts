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

  try {
    return await getAdminAuth().verifySessionCookie(cookie, true)
  } catch {
    return null
  }
})
