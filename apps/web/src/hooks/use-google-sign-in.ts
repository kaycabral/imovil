'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { safeNext } from '@/lib/safe-next'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

const AUTH_PARAMS = ['login', 'login_error', 'next']

/** Current path + query without the auth flags, so sign-in returns to the same page. */
function currentPath(pathname: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString())
  for (const key of AUTH_PARAMS) params.delete(key)
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

/**
 * Google sign-in through Supabase Auth (OAuth + PKCE). Redirects the whole page
 * to Google and back through `/auth/callback`, which sets the session cookie and
 * lands on the `next` param (same-origin) or the page the user was on.
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  async function signIn() {
    if (loading) return
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      toast.error('Login indisponível no momento. Tenta de novo mais tarde.')
      return
    }
    setLoading(true)
    const next = safeNext(searchParams.get('next')) ?? currentPath(pathname, searchParams)
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) {
      toast.error('Não foi possível entrar com o Google. Tenta de novo.')
      setLoading(false)
    }
    // On success the browser is already navigating to Google; keep `loading`.
  }

  return { signIn, loading }
}
