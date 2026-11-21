import type { SessionUser } from '@cbrl/supabase'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { updateBrokerProfile } from './profile'

const getServerUser = vi.fn<() => Promise<SessionUser | null>>()
const updateProfileContact =
  vi.fn<(id: string, contact: { phone: string; creci: string }) => Promise<boolean>>()
const revalidatePath = vi.fn<(path: string) => void>()

vi.mock('@/lib/auth/server', () => ({
  getServerUser: () => getServerUser(),
}))
vi.mock('@/lib/db', () => ({
  updateProfileContact: (id: string, contact: { phone: string; creci: string }) =>
    updateProfileContact(id, contact),
}))
vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}))

const user: SessionUser = {
  id: 'u1',
  email: 'u1@example.com',
  name: 'Ana',
  avatarUrl: null,
  emailVerified: true,
  appMetadata: {},
}

beforeEach(() => {
  getServerUser.mockResolvedValue(user)
  updateProfileContact.mockResolvedValue(true)
})
afterEach(() => vi.resetAllMocks())

describe('updateBrokerProfile action', () => {
  it('recusa sem sessão', async () => {
    getServerUser.mockResolvedValue(null)

    const result = await updateBrokerProfile({ phone: '(92) 99999-0000', creci: 'CRECI-1' })

    expect(result).toEqual({ ok: false, error: 'Sessão expirada — entre novamente.' })
    expect(updateProfileContact).not.toHaveBeenCalled()
  })

  it('recusa celular com menos de 10 dígitos', async () => {
    const result = await updateBrokerProfile({ phone: '(92) 9999', creci: 'CRECI-1' })

    expect(result).toEqual({ ok: false, error: 'Informe um celular válido com DDD.' })
    expect(updateProfileContact).not.toHaveBeenCalled()
  })

  it('recusa CRECI em branco', async () => {
    const result = await updateBrokerProfile({ phone: '(92) 99999-0000', creci: '   ' })

    expect(result).toEqual({ ok: false, error: 'Informe seu CRECI.' })
    expect(updateProfileContact).not.toHaveBeenCalled()
  })

  it('retorna erro quando o perfil não existe', async () => {
    updateProfileContact.mockResolvedValue(false)

    const result = await updateBrokerProfile({ phone: '(92) 99999-0000', creci: 'CRECI-1' })

    expect(result).toEqual({ ok: false, error: 'Perfil não encontrado — entre novamente.' })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('salva phone + creci com trim pro usuário da sessão e revalida o perfil', async () => {
    const result = await updateBrokerProfile({
      phone: ' (92) 99999-0000 ',
      creci: '  CRECI-AM 1234-F  ',
    })

    expect(result).toEqual({ ok: true })
    expect(updateProfileContact).toHaveBeenCalledWith('u1', {
      phone: '(92) 99999-0000',
      creci: 'CRECI-AM 1234-F',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel/perfil')
  })
})
