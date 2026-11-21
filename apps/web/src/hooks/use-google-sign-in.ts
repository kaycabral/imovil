'use client'

import { safeNext } from '@cbrl/next'
import { isSupabaseConfigured } from '@cbrl/supabase'
import { useGoogleSignIn as useSupabaseGoogleSignIn } from '@cbrl/supabase/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { toast } from 'sonner'

const AUTH_PARAMS = ['login', 'login_error', 'next']

/** Current path + query without the auth flags, so sign-in returns to the same page. */
function currentPath(pathname: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString())
  for (const key of AUTH_PARAMS) params.delete(key)
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

function notifySignInFailure(): void {
  toast.error('Não foi possível entrar com o Google. Tenta de novo.')
}

/**
 * Google sign-in (`@cbrl/supabase/react`) landing on the `next` param
 * (same-origin) or the page the user was on, with the app's toasts.
 */
export function useGoogleSignIn() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'), null) ?? currentPath(pathname, searchParams)
  const { signIn: startSignIn, pending } = useSupabaseGoogleSignIn({
    next,
    onError: notifySignInFailure,
  })

  const signIn = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Login indisponível no momento. Tenta de novo mais tarde.')
      return
    }
    await startSignIn()
  }, [startSignIn])

  return { signIn, loading: pending }
}
