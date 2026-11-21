'use client'

import { clearAllDrafts } from '@/app/painel/imoveis/_hooks/property-draft-storage'
import { getSupabaseBrowserClient } from '@cbrl/supabase/client'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useSignOut() {
  const router = useRouter()
  return useCallback(async () => {
    await getSupabaseBrowserClient()?.auth.signOut()
    // LGPD: rascunhos de imóvel contêm endereço completo + preço — limpar
    // no logout protege contra leak em máquina compartilhada.
    clearAllDrafts()
    router.push('/imoveis')
    router.refresh()
  }, [router])
}
