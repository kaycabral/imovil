import { getProfile } from '@/lib/db'
import type { PropertyBroker } from '@/shared'
import { whatsappUrl } from '@cbrl/br/phone'
import { cache } from 'react'

/**
 * Compõe os dados do corretor pra exibir no anúncio a partir do `profiles` do
 * dono. Se o perfil não tem creci ou um telefone que vire link do WhatsApp
 * (incompleto), retorna null — o consumidor decide como renderizar (esconder o
 * card de contato, por ex).
 *
 * Memoizado com React.cache: dentro do mesmo request, múltiplas chamadas pro
 * mesmo id reaproveitam a leitura.
 */
export const getBrokerById = cache(async (id: string): Promise<PropertyBroker | null> => {
  const profile = await getProfile(id)
  if (!profile?.phone || !profile.creci) return null

  const firstName = profile.displayName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Olá ${firstName},` : 'Olá,'
  const contactUrl = whatsappUrl(
    profile.phone,
    `${greeting} vi o imóvel pelo Imovil e queria agendar uma visita.`,
  )
  if (!contactUrl) return null
  return {
    name: profile.displayName ?? 'Corretor responsável',
    role: 'Corretor responsável',
    creci: profile.creci,
    whatsappUrl: contactUrl,
    avatar: profile.avatarUrl ?? null,
  }
})
