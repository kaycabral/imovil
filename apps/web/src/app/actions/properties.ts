'use server'

import { getAdminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/server'
import { geocodeAddress } from '@/lib/geocode'
import { FieldValue } from '@tekoa/db'
import {
  propertyCreateSchema,
  propertyStatusSchema,
  type PropertyCreateInput,
  type PropertyStatus,
} from '@tekoa/shared'
import { revalidatePath } from 'next/cache'

const COLLECTION = 'properties'

type ProfileDoc = {
  phone?: string
  creci?: string
}

type BrokerGate = { ok: true } | { ok: false; error: string }

/**
 * Verifica que o perfil do usuário tem phone + creci antes de permitir
 * criar/editar imóvel. Os dados em si **não** são copiados pro doc —
 * são compostos em runtime via `getBrokerByUid` no render do anúncio.
 */
async function requireBrokerProfile(uid: string): Promise<BrokerGate> {
  const db = getAdminDb()
  const snap = await db.collection('users').doc(uid).get()
  const profile = snap.data() as ProfileDoc | undefined

  if (!profile?.phone) {
    return { ok: false, error: 'Cadastre seu celular antes de publicar um imóvel.' }
  }
  if (!profile.creci) {
    return { ok: false, error: 'Cadastre seu CRECI antes de publicar um imóvel.' }
  }
  return { ok: true }
}

export type CreatePropertyResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string }

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

export async function createProperty(input: PropertyCreateInput): Promise<CreatePropertyResult> {
  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  const parsed = propertyCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const gate = await requireBrokerProfile(user.uid)
  if (!gate.ok) return { ok: false, error: gate.error }

  const data = parsed.data
  const db = getAdminDb()

  const base = slugify(data.title) || 'imovel'
  const slug = `${base}-${randomSuffix()}`

  // Geocoding "best effort" — se falhar, mapa não aparece mas o imóvel é criado.
  const coords = await geocodeAddress({
    street: data.street,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
  })

  const ref = db.collection(COLLECTION).doc()
  await ref.set({
    ...data,
    coords,
    ownerUid: user.uid,
    slug,
    status: 'draft',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  revalidatePath('/painel/imoveis')
  revalidatePath('/imoveis')

  return { ok: true, id: ref.id, slug }
}

export type UpdatePropertyResult = { ok: true; slug: string } | { ok: false; error: string }

export async function updateProperty(
  propertyId: string,
  input: PropertyCreateInput,
): Promise<UpdatePropertyResult> {
  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  const parsed = propertyCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const data = parsed.data

  const db = getAdminDb()
  const ref = db.collection(COLLECTION).doc(propertyId)
  const snap = await ref.get()
  if (!snap.exists) return { ok: false, error: 'Imóvel não encontrado.' }
  const current = snap.data() as
    | {
        ownerUid?: string
        slug?: string
        street?: string
        neighborhood?: string
        city?: string
        state?: string
        coords?: { lat: number; lng: number } | null
      }
    | undefined
  if (current?.ownerUid !== user.uid) return { ok: false, error: 'Sem permissão.' }

  const gate = await requireBrokerProfile(user.uid)
  if (!gate.ok) return { ok: false, error: gate.error }

  // Re-geocodifica apenas se algum campo de endereço mudou — economiza requests ao Nominatim.
  const addressChanged =
    current?.street !== data.street ||
    current?.neighborhood !== data.neighborhood ||
    current?.city !== data.city ||
    current?.state !== data.state
  const coords = addressChanged
    ? await geocodeAddress({
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      })
    : (current?.coords ?? null)

  await ref.update({
    ...data,
    coords,
    updatedAt: FieldValue.serverTimestamp(),
  })

  revalidatePath('/painel/imoveis')
  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${current?.slug ?? ''}`)

  return { ok: true, slug: current?.slug ?? '' }
}

export type SetPropertyStatusResult = { ok: true } | { ok: false; error: string }

export async function setPropertyStatus(
  propertyId: string,
  status: PropertyStatus,
): Promise<SetPropertyStatusResult> {
  const parsed = propertyStatusSchema.safeParse(status)
  if (!parsed.success) return { ok: false, error: 'Status inválido.' }

  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  const db = getAdminDb()
  const ref = db.collection(COLLECTION).doc(propertyId)
  const snap = await ref.get()
  if (!snap.exists) return { ok: false, error: 'Imóvel não encontrado.' }
  const data = snap.data() as { ownerUid?: string } | undefined
  if (data?.ownerUid !== user.uid) return { ok: false, error: 'Sem permissão.' }

  await ref.update({ status: parsed.data, updatedAt: FieldValue.serverTimestamp() })

  revalidatePath('/painel/imoveis')
  revalidatePath('/imoveis')
  return { ok: true }
}
