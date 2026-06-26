import { getAdminDb } from '@/lib/firebase/admin'
import type { PropertyBroker } from '@tekoa/shared'
import { cache } from 'react'

type UserDoc = {
  displayName?: string
  avatarUrl?: string
  phone?: string
  creci?: string
}

/**
 * Compõe os dados do corretor pra exibir no anúncio a partir do doc `users/{uid}`.
 * Se o perfil não tem phone/creci (usuário legado/incompleto), retorna null — o
 * consumidor decide como renderizar (esconder o card de contato, por ex).
 *
 * Memoizado com React.cache: dentro do mesmo request, múltiplas chamadas pro
 * mesmo uid reaproveitam a leitura.
 */
export const getBrokerByUid = cache(async (uid: string): Promise<PropertyBroker | null> => {
  const snap = await getAdminDb().collection('users').doc(uid).get()
  if (!snap.exists) return null
  const profile = snap.data() as UserDoc | undefined
  if (!profile?.phone || !profile.creci) return null

  const firstName = (profile.displayName ?? 'o corretor').split(/\s+/)[0]
  return {
    name: profile.displayName ?? 'Corretor responsável',
    role: 'Corretor responsável',
    creci: profile.creci,
    phone: profile.phone,
    whatsappText: `Olá ${firstName}, vi o imóvel pelo Tekoa e queria agendar uma visita.`,
    avatar: profile.avatarUrl ?? null,
  }
})
