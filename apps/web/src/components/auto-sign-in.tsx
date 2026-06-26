'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

import { useGoogleSignIn } from '@/hooks/use-google-sign-in'

// When a logged-out user lands on a protected route, the server redirects
// them to `/imoveis?login=1&next=...`. This component picks that up on mount
// and triggers the Google popup directly — no intermediate dialog.
//
// The popup is opened from a useEffect, so on browsers that require a user
// gesture for window.open it may be blocked. The redirect-to-login flow is
// always reachable from a click via the menu's "Entrar" button as a fallback.
function Inner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { signIn } = useGoogleSignIn()
  const fired = useRef(false)

  const wantsLogin = searchParams.get('login') === '1'

  useEffect(() => {
    if (!wantsLogin || fired.current) return
    fired.current = true

    // Strip ?login=1 from the URL so a refresh doesn't re-trigger and so the
    // address bar doesn't carry a stale flag once the popup is open.
    const params = new URLSearchParams(searchParams.toString())
    params.delete('login')
    const qs = params.toString()
    router.replace(`${pathname}${qs ? `?${qs}` : ''}` as never)

    void signIn()
  }, [wantsLogin, searchParams, pathname, router, signIn])

  return null
}

export function AutoSignIn() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  )
}
