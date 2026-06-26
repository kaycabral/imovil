'use client'

import { clearAllDrafts } from '@/app/painel/imoveis/_hooks/property-draft-storage'
import { getClientAuth } from '@/lib/firebase/client'
import { signOut } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useSignOut() {
  const router = useRouter()
  return useCallback(async () => {
    await signOut(getClientAuth())
    await fetch('/api/auth/session', { method: 'DELETE' })
    // LGPD: rascunhos de imóvel contêm endereço completo + preço — limpar
    // no logout protege contra leak em máquina compartilhada.
    clearAllDrafts()
    router.push('/imoveis')
    router.refresh()
  }, [router])
}
