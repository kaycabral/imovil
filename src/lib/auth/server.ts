import 'server-only'

import { readBackend } from '@/lib/backend-read'
import { sessionUserFromClaims, type SessionUser } from '@cbrl/supabase'
import { createSupabaseServerClient } from '@cbrl/supabase/server'
import { isAuthSessionMissingError } from '@supabase/supabase-js'
import { cache } from 'react'

/**
 * The verified signed-in user for this request, or null. `getClaims()` checks
 * the JWT signature (never trust `getSession()` on the server). An unavailable
 * Supabase reads as "signed out": public pages keep rendering and protected
 * ones redirect to login instead of 500-ing. Deduped per request.
 */
export const getServerUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient()
  if (!supabase) return null
  const result = await readBackend('session', async () => {
    const { data, error } = await supabase.auth.getClaims()
    if (error && !isAuthSessionMissingError(error)) throw error
    return data?.claims ?? null
  })
  return result.ok && result.data ? sessionUserFromClaims(result.data) : null
})
