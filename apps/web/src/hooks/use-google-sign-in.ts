'use client'

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { getClientAuth } from '@/lib/firebase/client'

function safeNext(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  async function signIn() {
    if (loading) return
    setLoading(true)
    try {
      const result = await signInWithPopup(getClientAuth(), new GoogleAuthProvider())
      const idToken = await result.user.getIdToken()
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`Failed to create session: status=${res.status} body=${body}`)
      }
      const next = safeNext(searchParams.get('next'))
      if (next) {
        router.push(next as Route)
      } else {
        router.refresh()
      }
      // Don't reset `loading` on success — the navigation/refresh re-renders
      // the caller, which will switch to the authenticated UI via useUser.
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed')
      setLoading(false)
    }
  }

  return { signIn, loading }
}
