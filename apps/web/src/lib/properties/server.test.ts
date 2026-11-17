import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getAdminDb = vi.fn<() => unknown>()

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => getAdminDb(),
}))

// Stub do Timestamp do Admin SDK — só precisamos que `instanceof` funcione.
class FakeTimestamp {
  constructor(public ms: number) {}
  toDate() {
    return new Date(this.ms)
  }
}
vi.mock('@imovil/db', () => ({
  Timestamp: FakeTimestamp,
}))

function makeDocData(overrides: Record<string, unknown> = {}) {
  return {
    slug: 'apto-x',
    ownerUid: 'u1',
    status: 'published',
    kind: 'apartment',
    deal: 'rental',
    title: 'Apartamento X',
    subtitle: '',
    postalCode: '69057070',
    street: 'Rua',
    neighborhood: 'Bairro',
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
    description: ['x'],
    details: [],
    images: [{ path: 'p', src: 'https://x/y.jpg', alt: 'a' }],
    createdAt: new FakeTimestamp(new Date('2026-01-02T00:00:00Z').getTime()),
    updatedAt: new FakeTimestamp(new Date('2026-01-02T00:00:00Z').getTime()),
    ...overrides,
  }
}

type StoredDoc = { id: string; data: () => Record<string, unknown> }

type QueryStub = {
  where: ReturnType<typeof vi.fn<(field: string, op: string, value: unknown) => QueryStub>>
  limit: ReturnType<typeof vi.fn<(n: number) => QueryStub>>
  get: ReturnType<typeof vi.fn<() => Promise<{ empty: boolean; docs: StoredDoc[] }>>>
}

function buildQueryResolver(docs: StoredDoc[]) {
  const query: QueryStub = {
    where: vi.fn<(field: string, op: string, value: unknown) => QueryStub>().mockReturnThis(),
    limit: vi.fn<(n: number) => QueryStub>().mockReturnThis(),
    get: vi
      .fn<() => Promise<{ empty: boolean; docs: StoredDoc[] }>>()
      .mockResolvedValue({ empty: docs.length === 0, docs }),
  }
  return {
    collection: vi.fn<() => QueryStub>(() => query),
  }
}

beforeEach(() => {
  getAdminDb.mockReset()
})
afterEach(() => vi.clearAllMocks())

describe('listProperties', () => {
  it('converte Timestamp em ISO string no boundary', async () => {
    const { listProperties } = await import('./server')
    const docs = [
      {
        id: 'p1',
        data: () => makeDocData({ slug: 'a' }),
      },
    ]
    getAdminDb.mockReturnValue(buildQueryResolver(docs))

    const result = await listProperties()
    expect(result).toHaveLength(1)
    expect(result[0]?.createdAt).toBe('2026-01-02T00:00:00.000Z')
    expect(result[0]?.updatedAt).toBe('2026-01-02T00:00:00.000Z')
    expect(result[0]?.id).toBe('p1')
  })

  it('ordena em memória por createdAt desc', async () => {
    const { listProperties } = await import('./server')
    const docs = [
      {
        id: 'old',
        data: () =>
          makeDocData({
            createdAt: new FakeTimestamp(new Date('2026-01-01').getTime()),
          }),
      },
      {
        id: 'new',
        data: () =>
          makeDocData({
            createdAt: new FakeTimestamp(new Date('2026-03-01').getTime()),
          }),
      },
      {
        id: 'mid',
        data: () =>
          makeDocData({
            createdAt: new FakeTimestamp(new Date('2026-02-01').getTime()),
          }),
      },
    ]
    getAdminDb.mockReturnValue(buildQueryResolver(docs))

    const result = await listProperties()
    expect(result.map((p) => p.id)).toEqual(['new', 'mid', 'old'])
  })

  it('aplica filtro ownerUid como where', async () => {
    const { listProperties } = await import('./server')
    const resolver = buildQueryResolver([])
    getAdminDb.mockReturnValue(resolver)

    await listProperties({ ownerUid: 'u1' })

    const collection = resolver.collection.mock.results[0]!.value
    expect(collection.where).toHaveBeenCalledWith('ownerUid', '==', 'u1')
  })

  it('aplica filtro status como where', async () => {
    const { listProperties } = await import('./server')
    const resolver = buildQueryResolver([])
    getAdminDb.mockReturnValue(resolver)

    await listProperties({ status: 'published' })

    const collection = resolver.collection.mock.results[0]!.value
    expect(collection.where).toHaveBeenCalledWith('status', '==', 'published')
  })

  it('preenche defaults quando doc tem campos faltando', async () => {
    const { listProperties } = await import('./server')
    const docs = [
      {
        id: 'p1',
        data: () => ({
          slug: 'a',
          ownerUid: 'u1',
          status: 'draft',
          kind: 'apartment',
          deal: 'rental',
          title: 'X',
          neighborhood: 'Bairro',
          city: 'Manaus',
          price: 100,
          area: 1,
          rooms: 1,
          builtYear: 2020,
        }),
      },
    ]
    getAdminDb.mockReturnValue(buildQueryResolver(docs))

    const result = await listProperties()
    expect(result[0]).toMatchObject({
      subtitle: '',
      postalCode: '',
      street: '',
      condo: 0,
      iptu: 0,
      suites: 0,
      parking: 0,
      petFriendly: false,
      furnished: false,
      description: [],
      details: [],
      images: [],
      state: '',
    })
  })
})

describe('getPropertyById', () => {
  it('retorna null quando doc não existe', async () => {
    const { getPropertyById } = await import('./server')
    const ref = {
      get: vi.fn().mockResolvedValue({ exists: false, id: 'missing', data: () => undefined }),
    }
    getAdminDb.mockReturnValue({ collection: vi.fn(() => ({ doc: vi.fn(() => ref) })) })

    const result = await getPropertyById('missing')
    expect(result).toBeNull()
  })

  it('retorna Property mapeada quando doc existe', async () => {
    const { getPropertyById } = await import('./server')
    const ref = {
      get: vi.fn().mockResolvedValue({
        exists: true,
        id: 'p42',
        data: () => makeDocData({ slug: 'apto-42' }),
      }),
    }
    getAdminDb.mockReturnValue({ collection: vi.fn(() => ({ doc: vi.fn(() => ref) })) })

    const result = await getPropertyById('p42')
    expect(result?.id).toBe('p42')
    expect(result?.slug).toBe('apto-42')
  })
})

describe('getPropertyBySlug', () => {
  it('retorna null quando a query vem vazia', async () => {
    const { getPropertyBySlug } = await import('./server')
    getAdminDb.mockReturnValue(buildQueryResolver([]))

    const result = await getPropertyBySlug('nao-existe')
    expect(result).toBeNull()
  })

  it('retorna property mapeada quando encontra', async () => {
    const { getPropertyBySlug } = await import('./server')
    const docs = [{ id: 'p42', data: () => makeDocData({ slug: 'apto-42' }) }]
    getAdminDb.mockReturnValue(buildQueryResolver(docs))

    const result = await getPropertyBySlug('apto-42')
    expect(result).not.toBeNull()
    expect(result?.id).toBe('p42')
    expect(result?.slug).toBe('apto-42')
  })

  it('faz where(slug == slug) e limit(1)', async () => {
    const { getPropertyBySlug } = await import('./server')
    const resolver = buildQueryResolver([])
    getAdminDb.mockReturnValue(resolver)

    await getPropertyBySlug('foo')
    const collection = resolver.collection.mock.results[0]!.value
    expect(collection.where).toHaveBeenCalledWith('slug', '==', 'foo')
    expect(collection.limit).toHaveBeenCalledWith(1)
  })
})
