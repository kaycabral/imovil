import { getAdminDb } from '@/lib/firebase/admin'
import { docData, queryDocData } from '@/lib/firestore'
import { Timestamp } from '@imovil/db'
import type { Property, PropertyStatus } from '@imovil/shared'

const COLLECTION = 'properties'

// The raw stored shape of a property doc. `fromDoc` reads these defensively
// (the `?? …` / `Array.isArray` guards survive a partial doc at runtime); the
// type is the trusted view of `snapshot.data()` taken at the read boundary.
type StoredProperty = Omit<Property, 'id'>

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

function fromDoc(id: string, data: StoredProperty): Property {
  return {
    id,
    slug: data.slug,
    ownerUid: data.ownerUid,
    status: data.status,
    kind: data.kind,
    deal: data.deal,
    title: data.title,
    subtitle: data.subtitle ?? '',
    postalCode: data.postalCode ?? '',
    street: data.street ?? '',
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state ?? '',
    coords:
      data.coords && typeof data.coords.lat === 'number' && typeof data.coords.lng === 'number'
        ? { lat: data.coords.lat, lng: data.coords.lng }
        : null,
    price: data.price,
    condo: data.condo ?? 0,
    iptu: data.iptu ?? 0,
    area: data.area,
    rooms: data.rooms,
    suites: data.suites ?? 0,
    parking: data.parking ?? 0,
    floor: data.floor,
    petFriendly: Boolean(data.petFriendly),
    furnished: Boolean(data.furnished),
    transitDistanceMin: data.transitDistanceMin ?? 0,
    transitLabel: data.transitLabel ?? '',
    builtYear: data.builtYear,
    description: Array.isArray(data.description) ? data.description : [],
    details: Array.isArray(data.details) ? data.details : [],
    images: Array.isArray(data.images) ? data.images : [],
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  }
}

export type ListPropertiesOptions = {
  status?: PropertyStatus
  ownerUid?: string
}

export async function listProperties(options: ListPropertiesOptions = {}): Promise<Property[]> {
  let query: FirebaseFirestore.Query = getAdminDb().collection(COLLECTION)
  if (options.ownerUid) query = query.where('ownerUid', '==', options.ownerUid)
  if (options.status) query = query.where('status', '==', options.status)

  // Ordenação em memória evita depender do composite index (ownerUid + createdAt ou status + createdAt);
  // carteira do corretor / vitrine pública cabem em um único fetch.
  const snap = await query.get()
  return snap.docs
    .map((d) => fromDoc(d.id, queryDocData<StoredProperty>(d)))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const snap = await getAdminDb().collection(COLLECTION).where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]!
  return fromDoc(doc.id, queryDocData<StoredProperty>(doc))
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const snap = await getAdminDb().collection(COLLECTION).doc(id).get()
  const data = docData<StoredProperty>(snap)
  if (!data) return null
  return fromDoc(snap.id, data)
}
