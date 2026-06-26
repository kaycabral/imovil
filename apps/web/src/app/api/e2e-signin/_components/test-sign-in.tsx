'use client'

import { getClientAuth } from '@/lib/firebase/client'
import { useEffect, useState } from 'react'

// firebase/auth is imported dynamically inside useEffect to prevent SSR execution.
// Top-level firebase/auth imports crash the Next.js server because the module
// accesses browser globals at initialization time.
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof err.message === 'string'
  ) {
    return err.message
  }
  if (typeof err === 'string') return err
  return 'Erro desconhecido'
}

export function TestSignIn({ token }: { token: string }) {
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>('pending')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!token) return
    void import('firebase/auth').then(({ signInWithCustomToken }) => {
      return signInWithCustomToken(getClientAuth(), token)
        .then(() => setStatus('done'))
        .catch((err: unknown) => {
          setStatus('error')
          const code =
            typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string'
              ? err.code
              : ''
          const message = errorMessage(err)
          setMessage(`${code} ${message}`.trim())
        })
    })
  }, [token])

  return (
    <>
      <div data-testid="sign-in-status">{status}</div>
      {/* Só preenche quando status === 'error' pra diagnóstico em CI */}
      <pre data-testid="sign-in-error">{status === 'error' ? message : ''}</pre>
    </>
  )
}
