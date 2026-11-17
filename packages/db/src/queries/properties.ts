import type { Property, PropertyCoords, PropertyStatus } from '@imovil/shared'
import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { getImovilDb } from '../pool'
import { properties } from '../schema'

type PropertyRow = typeof properties.$inferSelect

/** Insertable columns the app controls (id, slug, status and timestamps are owned here). */
export type PropertyWrite = Omit<
  typeof properties.$inferInsert,
  'id' | 'ownerId' | 'slug' | 'status' | 'createdAt' | 'updatedAt' | 'lat' | 'lng'
> & { coords: PropertyCoords | null }

function toCoords(row: PropertyRow): PropertyCoords | null {
  return row.lat === null || row.lng === null ? null : { lat: row.lat, lng: row.lng }
}

export function toProperty(row: PropertyRow): Property {
  const { lat: _lat, lng: _lng, floor, createdAt, updatedAt, ...rest } = row
  return {
    ...rest,
    coords: toCoords(row),
    ...(floor === null ? {} : { floor }),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
}

function coordColumns(coords: PropertyCoords | null): { lat: number | null; lng: number | null } {
  return coords ? { lat: coords.lat, lng: coords.lng } : { lat: null, lng: null }
}

export type ListPropertiesOptions = {
  status?: PropertyStatus
  ownerId?: string
}

/** Newest first. Public listing passes `status: 'published'`; the broker panel passes `ownerId`. */
export async function listProperties(options: ListPropertiesOptions = {}): Promise<Property[]> {
  const filters: SQL[] = []
  if (options.status) filters.push(eq(properties.status, options.status))
  if (options.ownerId) filters.push(eq(properties.ownerId, options.ownerId))
  const rows = await getImovilDb()
    .select()
    .from(properties)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(properties.createdAt))
  return rows.map(toProperty)
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const [row] = await getImovilDb()
    .select()
    .from(properties)
    .where(eq(properties.slug, slug))
    .limit(1)
  return row ? toProperty(row) : null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Null for unknown ids — including malformed ones from a URL, which Postgres would reject. */
export async function getPropertyById(id: string): Promise<Property | null> {
  if (!UUID.test(id)) return null
  const [row] = await getImovilDb().select().from(properties).where(eq(properties.id, id)).limit(1)
  return row ? toProperty(row) : null
}

/** Inserts a draft. Throws the Postgres unique violation (23505) when `slug` is taken. */
export async function insertProperty(
  ownerId: string,
  slug: string,
  input: PropertyWrite,
): Promise<{ id: string; slug: string }> {
  const { coords, ...data } = input
  const [row] = await getImovilDb()
    .insert(properties)
    .values({ ...data, ...coordColumns(coords), ownerId, slug, status: 'draft' })
    .returning({ id: properties.id, slug: properties.slug })
  if (!row) throw new Error('insertProperty: insert returned no row')
  return row
}

export async function updateProperty(id: string, input: PropertyWrite): Promise<void> {
  const { coords, ...data } = input
  await getImovilDb()
    .update(properties)
    .set({ ...data, ...coordColumns(coords), updatedAt: sql`now()` })
    .where(eq(properties.id, id))
}

export async function setPropertyStatus(id: string, status: PropertyStatus): Promise<void> {
  await getImovilDb()
    .update(properties)
    .set({ status, updatedAt: sql`now()` })
    .where(eq(properties.id, id))
}
