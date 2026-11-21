'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useGoogleSignIn } from '@/hooks/use-google-sign-in'

// When a logged-out user lands on a protected route, the server redirects
// them to `/imoveis?login=1&next=...`. This component picks that up on mount
// and starts the Google sign-in redirect directly — no intermediate dialog.
// It also turns `?login_error=1` (set by /auth/callback) into a toast.

function Inner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { signIn } = useGoogleSignIn()
  const fired = useRef(false)

  const wantsLogin = searchParams.get('login') === '1'
  const loginFailed = searchParams.get('login_error') === '1'

  useEffect(() => {
    if ((!wantsLogin && !loginFailed) || fired.current) return
    fired.current = true

    // Strip the flags so a refresh doesn't re-trigger them.
    const params = new URLSearchParams(searchParams.toString())
    params.delete('login')
    params.delete('login_error')
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}` as never)

    if (loginFailed) {
      toast.error('Não foi possível concluir o login. Tenta de novo.')
      return
    }
    void signIn()
  }, [wantsLogin, loginFailed, searchParams, pathname, router, signIn])

  return null
}

export function AutoSignIn() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  )
}
