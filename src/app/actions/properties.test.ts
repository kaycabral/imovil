import type { Profile, PropertyWrite } from '@/db'
import type { Property, PropertyCreateInput, PropertyStatus } from '@/shared'
import type { SessionUser } from '@cbrl/supabase'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mocks precisam ser definidos antes do import do módulo sob teste.
const getServerUser = vi.fn<() => Promise<SessionUser | null>>()
const getProfile = vi.fn<(id: string) => Promise<Profile | null>>()
const getPropertyById = vi.fn<(id: string) => Promise<Property | null>>()
const insertProperty =
  vi.fn<
    (ownerId: string, slug: string, input: PropertyWrite) => Promise<{ id: string; slug: string }>
  >()
const writeProperty = vi.fn<(id: string, input: PropertyWrite) => Promise<void>>()
const writePropertyStatus = vi.fn<(id: string, status: PropertyStatus) => Promise<void>>()
const revalidatePath = vi.fn<(path: string) => void>()
const geocodeAddress = vi.fn<
  (q: { street?: string; neighborhood: string; city: string; state: string }) => Promise<{
    lat: number
    lng: number
  } | null>
>()

vi.mock('@/lib/auth/server', () => ({
  getServerUser: () => getServerUser(),
}))
vi.mock('@/lib/db', () => ({
  getProfile: (id: string) => getProfile(id),
  getPropertyById: (id: string) => getPropertyById(id),
  insertProperty: (ownerId: string, slug: string, input: PropertyWrite) =>
    insertProperty(ownerId, slug, input),
  updateProperty: (id: string, input: PropertyWrite) => writeProperty(id, input),
  setPropertyStatus: (id: string, status: PropertyStatus) => writePropertyStatus(id, status),
}))
vi.mock('next/cache', () => ({
  revalidatePath: (path: string) => revalidatePath(path),
}))
vi.mock('@/lib/geocode', () => ({
  geocodeAddress: (q: never) => geocodeAddress(q),
}))

class UniqueViolation extends Error {
  readonly code = '23505'
  readonly constraint = 'properties_slug_unique'
}

function sessionUser(id: string): SessionUser {
  return {
    id,
    email: `${id}@example.com`,
    name: null,
    avatarUrl: null,
    emailVerified: true,
    appMetadata: {},
  }
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'u1',
    displayName: 'Juliana Prado',
    avatarUrl: null,
    phone: '(92) 99999-0000',
    creci: 'CRECI-AM 1234',
    ...overrides,
  }
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

function storedProperty(overrides: Partial<Property> = {}): Property {
  return {
    ...validInput(),
    id: 'p1',
    slug: 'apto-x',
    ownerId: 'u1',
    status: 'draft',
    coords: { lat: -3.0, lng: -60.0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  geocodeAddress.mockResolvedValue(null)
  getProfile.mockResolvedValue(profile())
  getPropertyById.mockResolvedValue(null)
  insertProperty.mockImplementation((_ownerId, slug) => Promise.resolve({ id: 'new-id', slug }))
  writeProperty.mockResolvedValue(undefined)
  writePropertyStatus.mockResolvedValue(undefined)
})
afterEach(() => vi.resetAllMocks())

describe('createProperty action', () => {
  it('recusa sem sessão', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(null)

    const result = await createProperty(validInput())
    expect(result).toEqual({ ok: false, error: 'Sessão expirada. Faça login novamente.' })
    expect(insertProperty).not.toHaveBeenCalled()
  })

  it('recusa input com zod inválido (sem mensagem genérica)', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))

    const result = await createProperty({ ...validInput(), title: 'ab' })
    expect(result.ok).toBe(false)
    expect(insertProperty).not.toHaveBeenCalled()
  })

  it('recusa quando profile não existe', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getProfile.mockResolvedValue(null)

    const result = await createProperty(validInput())
    expect(result).toEqual({
      ok: false,
      error: 'Cadastre seu celular antes de publicar um imóvel.',
    })
  })

  it('recusa quando profile não tem phone', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getProfile.mockResolvedValue(profile({ phone: null }))

    const result = await createProperty(validInput())
    expect(result).toEqual({
      ok: false,
      error: 'Cadastre seu celular antes de publicar um imóvel.',
    })
    expect(getProfile).toHaveBeenCalledWith('u1')
    expect(insertProperty).not.toHaveBeenCalled()
  })

  it('recusa quando profile não tem creci', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getProfile.mockResolvedValue(profile({ creci: null }))

    const result = await createProperty(validInput())
    expect(result).toEqual({
      ok: false,
      error: 'Cadastre seu CRECI antes de publicar um imóvel.',
    })
    expect(insertProperty).not.toHaveBeenCalled()
  })

  it('insere sem broker (resolvido em runtime) + coords + slug + revalida paths', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    geocodeAddress.mockResolvedValue({ lat: -3.123, lng: -60.987 })

    const result = await createProperty(validInput())

    expect(geocodeAddress).toHaveBeenCalledWith({
      street: 'Rua Teste',
      neighborhood: 'Adrianópolis',
      city: 'Manaus',
      state: 'AM',
    })
    expect(insertProperty).toHaveBeenCalledTimes(1)
    const [ownerId, slug, write] = insertProperty.mock.calls[0]!
    expect(ownerId).toBe('u1')
    expect(slug).toMatch(/^apartamento-test-[a-z0-9]+$/)
    expect(write).toMatchObject({ kind: 'apartment', coords: { lat: -3.123, lng: -60.987 } })
    // Broker NÃO é persistido — é composto em runtime a partir de profiles.
    expect(write).not.toHaveProperty('broker')
    expect(write).not.toHaveProperty('status')
    expect(result).toEqual({ ok: true, id: 'new-id', slug })
    expect(revalidatePath).toHaveBeenCalledWith('/painel/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis')
  })

  it('cria o imóvel mesmo quando geocoding falha (coords null)', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    geocodeAddress.mockResolvedValue(null)

    const result = await createProperty(validInput())

    expect(result.ok).toBe(true)
    expect(insertProperty.mock.calls[0]![2].coords).toBeNull()
  })

  it('usa "imovel" como base quando o título não gera slug', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))

    await createProperty({ ...validInput(), title: '!!! ??? ***' })

    expect(insertProperty.mock.calls[0]![1]).toMatch(/^imovel-/)
  })

  it('tenta de novo com outro slug quando o slug colide (sucesso na 2ª tentativa)', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    insertProperty
      .mockRejectedValueOnce(new UniqueViolation('duplicate key'))
      .mockImplementationOnce((_ownerId, slug) => Promise.resolve({ id: 'new-id', slug }))

    const result = await createProperty(validInput())

    expect(insertProperty).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ ok: true, id: 'new-id', slug: insertProperty.mock.calls[1]![1] })
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis')
  })

  it('desiste após 3 colisões de slug e propaga o erro', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    insertProperty.mockRejectedValue(new UniqueViolation('duplicate key'))

    await expect(createProperty(validInput())).rejects.toBeInstanceOf(UniqueViolation)
    expect(insertProperty).toHaveBeenCalledTimes(3)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('propaga erro que não é violação de unicidade sem tentar de novo', async () => {
    const { createProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    const failure = new Error('connection refused')
    insertProperty.mockRejectedValue(failure)

    await expect(createProperty(validInput())).rejects.toBe(failure)
    expect(insertProperty).toHaveBeenCalledTimes(1)
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('updateProperty action', () => {
  it('recusa sem sessão', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(null)
    const result = await updateProperty('p1', validInput())
    expect(result).toEqual({ ok: false, error: 'Sessão expirada. Faça login novamente.' })
  })

  it('recusa input com zod inválido', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    const result = await updateProperty('p1', { ...validInput(), title: 'ab' })
    expect(result.ok).toBe(false)
    expect(getPropertyById).not.toHaveBeenCalled()
  })

  it('retorna erro quando imóvel não existe', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getPropertyById.mockResolvedValue(null)
    const result = await updateProperty('p1', validInput())
    expect(result).toEqual({ ok: false, error: 'Imóvel não encontrado.' })
    expect(getPropertyById).toHaveBeenCalledWith('p1')
  })

  it('bloqueia quando não é o dono', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('attacker'))
    getPropertyById.mockResolvedValue(storedProperty({ ownerId: 'owner' }))

    const result = await updateProperty('p1', validInput())
    expect(result).toEqual({ ok: false, error: 'Sem permissão.' })
    expect(writeProperty).not.toHaveBeenCalled()
  })

  it('recusa quando profile não tem phone ou creci', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getPropertyById.mockResolvedValue(storedProperty())
    getProfile.mockResolvedValue(profile({ creci: null }))

    const result = await updateProperty('p1', validInput())
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('CRECI')
    expect(writeProperty).not.toHaveBeenCalled()
  })

  it('re-geocodifica quando endereço mudou', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getPropertyById.mockResolvedValue(storedProperty({ street: 'Rua Antiga' }))
    geocodeAddress.mockResolvedValue({ lat: -3.123, lng: -60.987 })

    const result = await updateProperty('p1', { ...validInput(), street: 'Rua Nova' })

    expect(result.ok).toBe(true)
    expect(geocodeAddress).toHaveBeenCalledWith({
      street: 'Rua Nova',
      neighborhood: 'Adrianópolis',
      city: 'Manaus',
      state: 'AM',
    })
    expect(writeProperty.mock.calls[0]![1].coords).toEqual({ lat: -3.123, lng: -60.987 })
  })

  it('NÃO re-geocodifica quando endereço não mudou', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    const existingCoords = { lat: -3.0, lng: -60.0 }
    getPropertyById.mockResolvedValue(storedProperty({ coords: existingCoords }))

    const result = await updateProperty('p1', validInput())

    expect(result.ok).toBe(true)
    expect(geocodeAddress).not.toHaveBeenCalled()
    expect(writeProperty.mock.calls[0]![1].coords).toEqual(existingCoords)
  })

  it('dono atualiza com sucesso + revalida paths', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getPropertyById.mockResolvedValue(storedProperty({ slug: 'apto-x' }))

    const result = await updateProperty('p1', validInput())

    expect(result).toEqual({ ok: true, slug: 'apto-x' })
    expect(writeProperty).toHaveBeenCalledTimes(1)
    const [id, patch] = writeProperty.mock.calls[0]!
    expect(id).toBe('p1')
    // floor ausente vira null explícito (limpa o valor anterior).
    expect(patch).toMatchObject({ kind: 'apartment', floor: null })
    // NÃO deve mexer em status/createdAt/broker no update
    expect(patch).not.toHaveProperty('status')
    expect(patch).not.toHaveProperty('createdAt')
    expect(patch).not.toHaveProperty('broker')
    expect(revalidatePath).toHaveBeenCalledWith('/painel/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis/apto-x')
  })

  it('preserva floor quando informado', async () => {
    const { updateProperty } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getPropertyById.mockResolvedValue(storedProperty())

    await updateProperty('p1', { ...validInput(), floor: 7 })

    expect(writeProperty.mock.calls[0]![1].floor).toBe(7)
  })
})

describe('setPropertyStatus action', () => {
  it('recusa status inválido', async () => {
    const { setPropertyStatus } = await import('./properties')
    // Exercita o guard de runtime (zod) com um status fora do union.
    const invalidStatus: string = 'nope'
    const result = await setPropertyStatus('p1', invalidStatus as PropertyStatus)
    expect(result).toEqual({ ok: false, error: 'Status inválido.' })
    expect(getServerUser).not.toHaveBeenCalled()
  })

  it('recusa sem sessão', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue(null)
    const result = await setPropertyStatus('p1', 'published')
    expect(result).toEqual({ ok: false, error: 'Sessão expirada. Faça login novamente.' })
  })

  it('retorna erro quando imóvel não existe', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getPropertyById.mockResolvedValue(null)

    const result = await setPropertyStatus('missing', 'published')
    expect(result).toEqual({ ok: false, error: 'Imóvel não encontrado.' })
  })

  it('bloqueia quando ownerId não bate com o usuário', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('attacker'))
    getPropertyById.mockResolvedValue(storedProperty({ ownerId: 'owner' }))

    const result = await setPropertyStatus('p1', 'paused')
    expect(result).toEqual({ ok: false, error: 'Sem permissão.' })
    expect(writePropertyStatus).not.toHaveBeenCalled()
  })

  it('atualiza status + revalida paths (inclusive o anúncio) quando é o dono', async () => {
    const { setPropertyStatus } = await import('./properties')
    getServerUser.mockResolvedValue(sessionUser('u1'))
    getPropertyById.mockResolvedValue(storedProperty({ slug: 'apto-x' }))

    const result = await setPropertyStatus('p1', 'published')

    expect(result).toEqual({ ok: true })
    expect(writePropertyStatus).toHaveBeenCalledWith('p1', 'published')
    expect(revalidatePath).toHaveBeenCalledWith('/painel/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis')
    expect(revalidatePath).toHaveBeenCalledWith('/imoveis/apto-x')
  })
})
