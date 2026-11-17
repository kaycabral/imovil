'use client'

import { useEffect, useState } from 'react'

import { toSessionUser, type SessionUser } from '@/lib/auth/session-user'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { supabasePublicConfig } from '@/lib/supabase/config'

type UserState = { user: SessionUser | null; loading: boolean }

/**
 * Signed-in user for client UI (menu, avatar). Driven by Supabase's auth events
 * (`INITIAL_SESSION` resolves the first render). Without Supabase config it
 * reports signed out right away instead of touching the SDK.
 */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>(() => ({
    user: null,
    loading: supabasePublicConfig() !== null,
  }))

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session
          ? toSessionUser({
              id: session.user.id,
              email: session.user.email,
              metadata: session.user.user_metadata,
            })
          : null,
        loading: false,
      })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return state
}
