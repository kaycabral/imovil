import { afterEach, describe, expect, it, vi } from 'vitest'

let userDoc: { exists: boolean; data: () => unknown } = { exists: false, data: () => undefined }

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: () => ({ doc: () => ({ get: () => Promise.resolve(userDoc) }) }),
  }),
}))

async function loadGetBrokerByUid() {
  vi.resetModules()
  const { getBrokerByUid } = await import('./broker')
  return getBrokerByUid
}

function withProfile(profile: unknown) {
  userDoc = { exists: true, data: () => profile }
}

describe('getBrokerByUid', () => {
  afterEach(() => {
    userDoc = { exists: false, data: () => undefined }
  })

  it('returns null when the user doc does not exist', async () => {
    await expect((await loadGetBrokerByUid())('uid-1')).resolves.toBeNull()
  })

  it('returns null when the profile has no phone or creci', async () => {
    withProfile({ displayName: 'Ana Souza', phone: '+5592999999999' })
    await expect((await loadGetBrokerByUid())('uid-1')).resolves.toBeNull()
  })

  it('composes the broker card from a complete profile', async () => {
    withProfile({
      displayName: 'Ana Souza',
      avatarUrl: 'https://example.com/a.png',
      phone: '+5592999999999',
      creci: '12345-F',
    })

    await expect((await loadGetBrokerByUid())('uid-1')).resolves.toEqual({
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

    await expect((await loadGetBrokerByUid())('uid-1')).resolves.toMatchObject({
      name: 'Corretor responsável',
      avatar: null,
    })
  })
})
