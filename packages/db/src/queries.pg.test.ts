import { isUniqueViolation } from '@cbrl/pg'
import { sql } from 'drizzle-orm'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  getProfile,
  getPropertyById,
  getPropertyBySlug,
  imovilDb,
  insertProperty,
  listProperties,
  listReleases,
  seedUser,
  setPropertyStatus,
  truncateImovilTables,
  updateProfileContact,
  updateProperty,
  type PropertyWrite,
} from './index'
import { changelog } from './schema'

const BROKER = '11111111-1111-4111-8111-111111111111'
const OTHER = '22222222-2222-4222-8222-222222222222'

function write(overrides: Partial<PropertyWrite> = {}): PropertyWrite {
  return {
    kind: 'apartment',
    deal: 'rental',
    title: 'Apartamento no Adrianópolis',
    subtitle: '',
    postalCode: '69057000',
    street: 'Rua Teste',
    neighborhood: 'Adrianópolis',
    city: 'Manaus',
    state: 'AM',
    coords: { lat: -3.1, lng: -60.0 },
    price: 250_000,
    area: 60,
    rooms: 2,
    builtYear: 2015,
    description: ['Bem localizado.'],
    images: [{ path: `${BROKER}/a.jpg`, src: 'https://example.com/a.jpg', alt: 'Sala' }],
    ...overrides,
  }
}

async function pgError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected the query to fail')
}

beforeAll(async () => {
  await imovilDb.migrate()
})

beforeEach(async () => {
  const db = imovilDb.db()
  await truncateImovilTables(db)
  await seedUser(db, {
    id: BROKER,
    email: 'broker@example.com',
    displayName: 'Ana Souza',
    avatarUrl: 'https://example.com/ana.png',
  })
  await seedUser(db, { id: OTHER, email: 'other@example.com' })
})

afterAll(async () => {
  await imovilDb.close()
})

describe('profiles', () => {
  it('are created by the auth trigger from the Google metadata', async () => {
    await expect(getProfile(BROKER)).resolves.toEqual({
      id: BROKER,
      displayName: 'Ana Souza',
      avatarUrl: 'https://example.com/ana.png',
      phone: null,
      creci: null,
    })
  })

  it('store the broker contact', async () => {
    await expect(
      updateProfileContact(BROKER, { phone: '92999990000', creci: 'CRECI-1' }),
    ).resolves.toBe(true)
    await expect(getProfile(BROKER)).resolves.toMatchObject({
      phone: '92999990000',
      creci: 'CRECI-1',
    })
  })

  it('report a missing profile instead of silently succeeding', async () => {
    await expect(
      updateProfileContact('33333333-3333-4333-8333-333333333333', { phone: '1', creci: '2' }),
    ).resolves.toBe(false)
  })
})

describe('properties', () => {
  it('round-trip through insert, get and list as drafts', async () => {
    const { id, slug } = await insertProperty(BROKER, 'apto-adrianopolis-abc123', write())
    expect(slug).toBe('apto-adrianopolis-abc123')

    const byId = await getPropertyById(id)
    expect(byId).toMatchObject({
      id,
      ownerId: BROKER,
      status: 'draft',
      coords: { lat: -3.1, lng: -60.0 },
      price: 250_000,
      details: [],
    })
    expect(byId).not.toHaveProperty('floor')
    await expect(getPropertyBySlug(slug)).resolves.toEqual(byId)
    await expect(listProperties({ status: 'published' })).resolves.toEqual([])
    await expect(listProperties({ ownerId: BROKER })).resolves.toHaveLength(1)
  })

  it('treat a malformed id as not found instead of a Postgres error', async () => {
    await expect(getPropertyById('not-a-uuid')).resolves.toBeNull()
  })

  it('list newest first and filter by owner and status', async () => {
    const first = await insertProperty(BROKER, 'first', write())
    const second = await insertProperty(BROKER, 'second', write({ floor: 3 }))
    await insertProperty(OTHER, 'third', write())
    await setPropertyStatus(first.id, 'published')

    const mine = await listProperties({ ownerId: BROKER })
    expect(mine.map((p) => p.slug)).toEqual(['second', 'first'])
    expect(mine[0]?.floor).toBe(3)
    const published = await listProperties({ status: 'published' })
    expect(published.map((p) => p.id)).toEqual([first.id])
    expect(second.slug).toBe('second')
  })

  it('reject a duplicate slug with a detectable unique violation', async () => {
    await insertProperty(BROKER, 'same-slug', write())
    const error = await pgError(insertProperty(OTHER, 'same-slug', write()))
    expect(isUniqueViolation(error)).toBe(true)
    expect(isUniqueViolation(error, 'properties_slug_unique')).toBe(true)
    expect(isUniqueViolation(error, 'another_constraint')).toBe(false)
  })

  it('keep coordinates as a pair and clear both when geocoding fails', async () => {
    const { id } = await insertProperty(BROKER, 'coords', write())
    await updateProperty(id, write({ coords: null }))
    await expect(getPropertyById(id)).resolves.toMatchObject({ coords: null })
    const error = await pgError(
      imovilDb.db().execute(sql`update properties set lat = 1, lng = null where id = ${id}`),
    )
    const reason = error instanceof Error ? (error.cause ?? error) : error
    expect(String(reason)).toMatch(/properties_coords_pair/)
  })

  it('enforce native invariants (price, postal code)', async () => {
    await expect(pgError(insertProperty(BROKER, 'zero', write({ price: 0 })))).resolves.toBeTruthy()
    await expect(
      pgError(insertProperty(BROKER, 'cep', write({ postalCode: '123' }))),
    ).resolves.toBeTruthy()
  })

  it('hold sale prices beyond int4 (cents)', async () => {
    const { id } = await insertProperty(BROKER, 'mansion', write({ price: 3_500_000_000 }))
    await expect(getPropertyById(id)).resolves.toMatchObject({ price: 3_500_000_000 })
  })

  it('cascade away with the owner', async () => {
    await insertProperty(BROKER, 'gone', write())
    await imovilDb.db().execute(sql`delete from auth.users where id = ${BROKER}`)
    await expect(getProfile(BROKER)).resolves.toBeNull()
    await expect(getPropertyBySlug('gone')).resolves.toBeNull()
  })
})

describe('changelog', () => {
  it('lists releases newest first', async () => {
    await imovilDb
      .db()
      .insert(changelog)
      .values([
        { tagName: 'v0.1.0', name: '0.1.0', body: 'a', publishedAt: new Date('2026-01-01') },
        { tagName: 'v0.2.0', name: '0.2.0', body: 'b', publishedAt: new Date('2026-02-01') },
      ])
    const releases = await listReleases(10)
    expect(releases.map((r) => r.tagName)).toEqual(['v0.2.0', 'v0.1.0'])
    expect(releases[0]?.publishedAt).toBe('2026-02-01T00:00:00.000Z')
  })
})

describe('row level security', () => {
  it('exposes nothing to the public API roles', async () => {
    await insertProperty(BROKER, 'hidden', write())
    const rows = await imovilDb.db().transaction(async (tx) => {
      await tx.execute(sql`set local role anon`)
      const result = await tx.execute(sql`select count(*)::int as n from properties`)
      return result.rows
    })
    expect(rows).toEqual([{ n: 0 }])
  })
})
