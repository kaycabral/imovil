'use client'

import { useEffect, useState } from 'react'

import { isSupabaseConfigured, sessionUserFromAuthUser, type SessionUser } from '@cbrl/supabase'
import { getSupabaseBrowserClient } from '@cbrl/supabase/client'

type UserState = { user: SessionUser | null; loading: boolean }

/**
 * Signed-in user for client UI (menu, avatar). Driven by Supabase's auth events
 * (`INITIAL_SESSION` resolves the first render). Without Supabase config it
 * reports signed out right away instead of touching the SDK.
 */
export function useUser(): UserState {
  const [state, setState] = useState<UserState>(() => ({
    user: null,
    loading: isSupabaseConfigured(),
  }))

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session ? sessionUserFromAuthUser(session.user) : null,
        loading: false,
      })
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return state
}
