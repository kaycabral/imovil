import type { Profile } from '@imovil/db'
import { afterEach, describe, expect, it, vi } from 'vitest'

const getProfile = vi.fn<(id: string) => Promise<Profile | null>>()

vi.mock('@/lib/db', () => ({
  getProfile: (id: string) => getProfile(id),
}))

async function loadGetBrokerById() {
  vi.resetModules()
  const { getBrokerById } = await import('./broker')
  return getBrokerById
}

function withProfile(overrides: Partial<Profile>) {
  getProfile.mockResolvedValue({
    id: 'uid-1',
    displayName: null,
    avatarUrl: null,
    phone: null,
    creci: null,
    ...overrides,
  })
}

describe('getBrokerById', () => {
  afterEach(() => {
    getProfile.mockReset()
  })

  it('returns null when the profile does not exist', async () => {
    getProfile.mockResolvedValue(null)
    await expect((await loadGetBrokerById())('uid-1')).resolves.toBeNull()
    expect(getProfile).toHaveBeenCalledWith('uid-1')
  })

  it('returns null when the profile has no phone or creci', async () => {
    withProfile({ displayName: 'Ana Souza', phone: '+5592999999999' })
    await expect((await loadGetBrokerById())('uid-1')).resolves.toBeNull()
  })

  it('returns null when the profile has creci but no phone', async () => {
    withProfile({ displayName: 'Ana Souza', creci: '12345-F' })
    await expect((await loadGetBrokerById())('uid-1')).resolves.toBeNull()
  })

  it('composes the broker card from a complete profile', async () => {
    withProfile({
      displayName: 'Ana Souza',
      avatarUrl: 'https://example.com/a.png',
      phone: '+5592999999999',
      creci: '12345-F',
    })

    await expect((await loadGetBrokerById())('uid-1')).resolves.toEqual({
      name: 'Ana Souza',
      role: 'Corretor responsável',
      creci: '12345-F',
      phone: '+5592999999999',
      whatsappText: 'Olá Ana, vi o imóvel pelo Imovil e queria agendar uma visita.',
      avatar: 'https://example.com/a.png',
    })
  })

  it('falls back to generic name and no avatar when the profile omits them', async () => {
    withProfile({ phone: '+5592999999999', creci: '12345-F' })

    await expect((await loadGetBrokerById())('uid-1')).resolves.toMatchObject({
      name: 'Corretor responsável',
      whatsappText: 'Olá, vi o imóvel pelo Imovil e queria agendar uma visita.',
      avatar: null,
    })
  })
})
