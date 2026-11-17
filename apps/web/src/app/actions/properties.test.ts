import type { Property, PropertyCreateInput, PropertyStatus } from '@imovil/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The doc payload the action writes to Firestore: the stored property shape
// (no `id`) plus the server-stamped `createdAt`/`updatedAt` sentinels.
type WrittenDoc = Omit<Property, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

// Mocks precisam ser definidos antes do import do módulo sob teste.
const getServerUser = vi.fn<() => Promise<{ uid: string; name?: string } | null>>()
const getAdminDb = vi.fn<() => unknown>()
const revalidatePath = vi.fn<(path: string) => void>()

vi.mock('@/lib/firebase/server', () => ({
  getServerUser: () => getServerUser(),
}))
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => getAdminDb(),
}))
vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}))
vi.mock('@imovil/db', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
}))

const geocodeAddress = vi.fn<
  (q: { street?: string; neighborhood: string; city: string; state: string }) => Promise<{
    lat: number
    lng: number
  } | null>
>()
vi.mock('@/lib/geocode', () => ({
  geocodeAddress: (q: never) => geocodeAddress(q),
}))

// Stub mínimo do Admin SDK que a gente precisa (collection().doc().set/update/get)
function buildDb({
  profile,
  property,
}: {
  profile?: Record<string, unknown>
  property?: { exists: boolean; data?: Record<string, unknown> }
} = {}) {
  const userSet = vi.fn().mockResolvedValue(undefined)
  const userGet = vi.fn().mockResolvedValue({ data: () => profile ?? undefined, exists: !!profile })

  const propertyRefSet = vi.fn<(doc: WrittenDoc) => Promise<void>>().mockResolvedValue(undefined)
  const propertyRefUpdate = vi
    .fn<(patch: Partial<WrittenDoc>) => Promise<void>>()
    .mockResolvedValue(undefined)
  const propertyRefGet = vi.fn().mockResolvedValue({
    exists: property?.exists ?? false,
    data: () => property?.data,
  })

  const propertyDoc = vi.fn((id?: string) => ({
    id: id ?? 'generated-id',
    set: propertyRefSet,
    update: propertyRefUpdate,
    get: propertyRefGet,
  }))

  const db = {
    collection: vi.fn((name: string) => {
      if (name === 'users') {
        return {
          doc: vi.fn(() => ({ set: userSet, get: userGet })),
        }
      }
      return { doc: propertyDoc }
    }),
  }
  return { db, propertyRefSet, propertyRefUpdate, propertyRefGet, propertyDoc }
}

function validInput(): PropertyCreateInput {
  return {
    kind: 'apartment',
    deal: 'rental',
    title: 'Apartamento test',
    subtitle: '',
    postalCode: '69057070',
    street: 'Rua Teste',
    neighborhood: 'Adrianópolis',
    city: 'Manaus',
    state: 'AM',
    price: 280000,
    condo: 0,
    iptu: 0,
    area: 50,
    rooms: 2,
    suites: 0,
    parking: 0,
    petFriendly: false,
    furnished: false,
    transitDistanceMin: 0,
    transitLabel: '',
    builtYear: 2020,
    description: ['Descrição.'],
    details: [],
    images: [{ path: 'p', src: 'https://x/y.jpg', alt: 'a' }],
  }
}

beforeEach(() => {
  getServerUser.mockReset()
  getAdminDb.mockReset()
  revalidatePath.mockReset()
  geocodeAddress.mockReset()
  geocodeAddress.mockResolvedValue(null)
})
afterEach(() => vi.clearAllMocks())

describe('createProperty action', () => {
  it('recusa sem sessão', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(null)

    const result = await createProperty(validInput())
    expect(result).toEqual({ ok: false, error: 'Sessão expirada. Faça login novamente.' })
  })

  it('recusa input com zod inválido (sem mensagem genérica)', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db } = buildDb({ profile: { phone: '(92) 99999-0000', creci: 'CRECI-1' } })
    getAdminDb.mockReturnValue(db)

    const result = await createProperty({ ...validInput(), title: 'ab' })
    expect(result.ok).toBe(false)
  })

  it('recusa quando profile não tem phone', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db } = buildDb({ profile: { creci: 'CRECI-1' } })
    getAdminDb.mockReturnValue(db)

    const result = await createProperty(validInput())
    expect(result).toEqual({
      ok: false,
      error: 'Cadastre seu celular antes de publicar um imóvel.',
    })
  })

  it('recusa quando profile não tem creci', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db } = buildDb({ profile: { phone: '(92) 99999-0000' } })
    getAdminDb.mockReturnValue(db)

    const result = await createProperty(validInput())
    expect(result).toEqual({
      ok: false,
      error: 'Cadastre seu CRECI antes de publicar um imóvel.',
    })
  })

  it('escreve no Firestore sem broker (resolvido em runtime) + coords + status draft + revalida paths', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1', name: 'Juliana Prado' })
    const { db, propertyRefSet } = buildDb({
      profile: {
        displayName: 'Juliana Prado',
        avatarUrl: 'https://g/j.jpg',
        phone: '(92) 99999-0000',
        creci: 'CRECI-AM 1234',
      },
    })
    getAdminDb.mockReturnValue(db)
    geocodeAddress.mockResolvedValue({ lat: -3.123, lng: -60.987 })

    const result = await createProperty(validInput())

    expect(result.ok).toBe(true)
    expect(geocodeAddress).toHaveBeenCalledWith({
      street: 'Rua Teste',
      neighborhood: 'Adrianópolis',
      city: 'Manaus',
      state: 'AM',
    })
    expect(propertyRefSet).toHaveBeenCalledTimes(1)
    const doc = propertyRefSet.mock.calls[0]![0]
    expect(doc).toMatchObject({
      kind: 'apartment',
      ownerUid: 'u1',
      status: 'draft',
      coords: { lat: -3.123, lng: -60.987 },
      createdAt: 'SERVER_TS',
      updatedAt: 'SERVER_TS',
    })
    // Broker NÃO é persistido — é composto em runtime a partir de users/{uid}.
    expect(doc).not.toHaveProperty('broker')
    expect(doc.slug).toMatch(/^apartamento-test-/)
    expect(revalidatePath).toHaveBeenCalledWith('/painel/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis')
  })

  it('cria o imóvel mesmo quando geocoding falha (coords null)', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db, propertyRefSet } = buildDb({
      profile: {
        displayName: 'Juliana',
        phone: '(92) 99999-0000',
        creci: 'CRECI-1',
      },
    })
    getAdminDb.mockReturnValue(db)
    geocodeAddress.mockResolvedValue(null)

    const result = await createProperty(validInput())

    expect(result.ok).toBe(true)
    const doc = propertyRefSet.mock.calls[0]![0]
    expect(doc.coords).toBeNull()
  })
})

describe('updateProperty action', () => {
  it('recusa sem sessão', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(null)
    const result = await updateProperty('p1', validInput())
    expect(result).toEqual({ ok: false, error: 'Sessão expirada. Faça login novamente.' })
  })

  it('retorna erro quando imóvel não existe', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db } = buildDb({ property: { exists: false } })
    getAdminDb.mockReturnValue(db)
    const result = await updateProperty('p1', validInput())
    expect(result).toEqual({ ok: false, error: 'Imóvel não encontrado.' })
  })

  it('bloqueia quando não é o dono', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'attacker' })
    const { db, propertyRefUpdate } = buildDb({
      property: { exists: true, data: { ownerUid: 'owner', slug: 'x' } },
    })
    getAdminDb.mockReturnValue(db)

    const result = await updateProperty('p1', validInput())
    expect(result).toEqual({ ok: false, error: 'Sem permissão.' })
    expect(propertyRefUpdate).not.toHaveBeenCalled()
  })

  it('recusa quando profile não tem phone ou creci', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    // Usa o mesmo buildDb, mas precisamos ter ambos: property por id + profile por id.
    // buildDb já diferencia users vs properties via collection name.
    const { db } = buildDb({
      property: { exists: true, data: { ownerUid: 'u1', slug: 'x' } },
      profile: { phone: '(92) 99999-0000' },
    })
    getAdminDb.mockReturnValue(db)

    const result = await updateProperty('p1', validInput())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('CRECI')
  })

  it('re-geocodifica quando endereço mudou', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db, propertyRefUpdate } = buildDb({
      property: {
        exists: true,
        data: {
          ownerUid: 'u1',
          slug: 'x',
          street: 'Rua Antiga',
          neighborhood: 'Adrianópolis',
          city: 'Manaus',
          state: 'AM',
          coords: { lat: -3.0, lng: -60.0 },
        },
      },
      profile: { displayName: 'J', phone: '(92) 99999-0000', creci: 'CRECI-1' },
    })
    getAdminDb.mockReturnValue(db)
    geocodeAddress.mockResolvedValue({ lat: -3.123, lng: -60.987 })

    const result = await updateProperty('p1', { ...validInput(), street: 'Rua Nova' })

    expect(result.ok).toBe(true)
    expect(geocodeAddress).toHaveBeenCalled()
    expect(propertyRefUpdate.mock.calls[0]![0].coords).toEqual({ lat: -3.123, lng: -60.987 })
  })

  it('NÃO re-geocodifica quando endereço não mudou', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const existingCoords = { lat: -3.0, lng: -60.0 }
    const input = validInput()
    const { db, propertyRefUpdate } = buildDb({
      property: {
        exists: true,
        data: {
          ownerUid: 'u1',
          slug: 'x',
          street: input.street,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
          coords: existingCoords,
        },
      },
      profile: { displayName: 'J', phone: '(92) 99999-0000', creci: 'CRECI-1' },
    })
    getAdminDb.mockReturnValue(db)

    const result = await updateProperty('p1', input)

    expect(result.ok).toBe(true)
    expect(geocodeAddress).not.toHaveBeenCalled()
    expect(propertyRefUpdate.mock.calls[0]![0].coords).toEqual(existingCoords)
  })

  it('dono atualiza com sucesso + revalida paths', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const input = validInput()
    const { db, propertyRefUpdate } = buildDb({
      property: {
        exists: true,
        data: {
          ownerUid: 'u1',
          slug: 'apto-x',
          street: input.street,
          neighborhood: input.neighborhood,
          city: input.city,
          state: input.state,
        },
      },
      profile: { displayName: 'J', phone: '(92) 99999-0000', creci: 'CRECI-1' },
    })
    getAdminDb.mockReturnValue(db)

    const result = await updateProperty('p1', input)

    expect(result).toEqual({ ok: true, slug: 'apto-x' })
    expect(propertyRefUpdate).toHaveBeenCalledTimes(1)
    const patch = propertyRefUpdate.mock.calls[0]![0]
    expect(patch).toMatchObject({
      kind: 'apartment',
      updatedAt: 'SERVER_TS',
    })
    // NÃO deve mexer em status/createdAt/broker no update
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('createdAt')
    expect(patch).not.toHaveProperty('broker')
    expect(revalidatePath).toHaveBeenCalledWith('/painel/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis/apto-x')
  })
})

describe('setPropertyStatus action', () => {
  it('recusa status inválido', async () => {
    const { setPropertyStatus } = await import('./properties')
    // Exercita o guard de runtime (zod) com um status fora do union.
    const invalidStatus: string = 'nope'
    const result = await setPropertyStatus('p1', invalidStatus as PropertyStatus)
    expect(result).toEqual({ ok: false, error: 'Status inválido.' })
  })

  it('recusa sem sessão', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue(null)
    const result = await setPropertyStatus('p1', 'published')
    expect(result).toEqual({ ok: false, error: 'Sessão expirada. Faça login novamente.' })
  })

  it('retorna erro quando imóvel não existe', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db } = buildDb({ property: { exists: false } })
    getAdminDb.mockReturnValue(db)

    const result = await setPropertyStatus('missing', 'published')
    expect(result).toEqual({ ok: false, error: 'Imóvel não encontrado.' })
  })

  it('bloqueia quando ownerUid não bate com o usuário', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'attacker' })
    const { db, propertyRefUpdate } = buildDb({
      property: { exists: true, data: { ownerUid: 'owner' } },
    })
    getAdminDb.mockReturnValue(db)

    const result = await setPropertyStatus('p1', 'paused')
    expect(result).toEqual({ ok: false, error: 'Sem permissão.' })
    expect(propertyRefUpdate).not.toHaveBeenCalled()
  })

  it('atualiza status + revalida paths quando é o dono', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue({ uid: 'u1' })
    const { db, propertyRefUpdate } = buildDb({
      property: { exists: true, data: { ownerUid: 'u1' } },
    })
    getAdminDb.mockReturnValue(db)

    const result = await setPropertyStatus('p1', 'published')

    expect(result).toEqual({ ok: true })
    expect(propertyRefUpdate).toHaveBeenCalledWith({
      status: 'published',
      updatedAt: 'SERVER_TS',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/painel/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis')
  })
})
