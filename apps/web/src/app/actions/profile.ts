'use server'

import { getServerUser } from '@/lib/auth/server'
import { updateProfileContact } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type UpdateBrokerProfileResult = { ok: true } | { ok: false; error: string }

/**
 * Saves the broker contact (phone + CRECI) shown on listings. Runs on the
 * server for the signed-in user only — the browser never writes the database.
 */
export async function updateBrokerProfile(input: {
  phone: string
  creci: string
}): Promise<UpdateBrokerProfileResult> {
  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sessão expirada — entre novamente.' }

  const phone = input.phone.trim()
  const creci = input.creci.trim()
  if (phone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Informe um celular válido com DDD.' }
  }
  if (creci.length === 0) return { ok: false, error: 'Informe seu CRECI.' }

  const saved = await updateProfileContact(user.id, { phone, creci })
  if (!saved) return { ok: false, error: 'Perfil não encontrado — entre novamente.' }

  revalidatePath('/painel/perfil')
  return { ok: true }
}
