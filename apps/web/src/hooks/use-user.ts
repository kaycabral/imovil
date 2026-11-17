'use client'

import { getClientAuth, isClientFirebaseConfigured } from '@/lib/firebase/client'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isClientFirebaseConfigured)

  useEffect(() => {
    if (!isClientFirebaseConfigured()) return
    const unsubscribe = onAuthStateChanged(getClientAuth(), (next) => {
      setUser(next)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  return { user, loading }
}
