'use server'

import { getServerUser } from '@/lib/auth/server'
import {
  getProfile,
  getPropertyById,
  insertProperty,
  isUniqueViolation,
  updateProperty as writeProperty,
  setPropertyStatus as writePropertyStatus,
} from '@/lib/db'
import { geocodeAddress } from '@/lib/geocode'
import {
  propertyCreateSchema,
  propertyStatusSchema,
  type PropertyCreateInput,
  type PropertyStatus,
} from '@imovil/shared'
import { revalidatePath } from 'next/cache'

type BrokerGate = { ok: true } | { ok: false; error: string }

/**
 * Verifica que o perfil do usuário tem phone + creci antes de permitir
 * criar/editar imóvel. Os dados em si **não** são copiados pro imóvel —
 * são compostos em runtime via `getBrokerById` no render do anúncio.
 */
async function requireBrokerProfile(userId: string): Promise<BrokerGate> {
  const profile = await getProfile(userId)
  if (!profile?.phone) {
    return { ok: false, error: 'Cadastre seu celular antes de publicar um imóvel.' }
  }
  if (!profile.creci) {
    return { ok: false, error: 'Cadastre seu CRECI antes de publicar um imóvel.' }
  }
  return { ok: true }
}

export type CreatePropertyResult =
  { ok: true; id: string; slug: string } | { ok: false; error: string }

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

/** Slug collisions are already unlikely (random suffix); the unique index makes them safe. */
const SLUG_ATTEMPTS = 3

export async function createProperty(input: PropertyCreateInput): Promise<CreatePropertyResult> {
  const user = await getServerUser()
  if (!user) return { ok: false, error: 'Sessão expirada. Faça login novamente.' }

  const parsed = propertyCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const gate = await requireBrokerProfile(user.id)
  if (!gate.ok) return { ok: false, error: gate.error }

  const data = parsed.data
  const base = slugify(data.title) || 'imovel'

  // Geocoding "best effort" — se falhar, mapa não aparece mas o imóvel é criado.
  const coords = await geocodeAddress({
    street: data.street,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
  })

  for (let attempt = 1; ; attempt++) {
    try {
      const created = await insertProperty(user.id, `${base}-${randomSuffix()}`, {
        ...data,
        coords,
      })
      revalidatePath('/painel/imoveis')
      revalidatePath('/imoveis')
      return { ok: true, ...created }
    } catch (error) {
      if (attempt < SLUG_ATTEMPTS && isUniqueViolation(error, 'properties_slug_unique')) continue
      throw error
    }
  }
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

  const current = await getPropertyById(propertyId)
  if (!current) return { ok: false, error: 'Imóvel não encontrado.' }
  if (current.ownerId !== user.id) return { ok: false, error: 'Sem permissão.' }

  const gate = await requireBrokerProfile(user.id)
  if (!gate.ok) return { ok: false, error: gate.error }

  // Re-geocodifica apenas se algum campo de endereço mudou — economiza requests ao Nominatim.
  const addressChanged =
    current.street !== data.street ||
    current.neighborhood !== data.neighborhood ||
    current.city !== data.city ||
    current.state !== data.state
  const coords = addressChanged
    ? await geocodeAddress({
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      })
    : current.coords

  await writeProperty(propertyId, { ...data, floor: data.floor ?? null, coords })

  revalidatePath('/painel/imoveis')
  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${current.slug}`)

  return { ok: true, slug: current.slug }
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

  const current = await getPropertyById(propertyId)
  if (!current) return { ok: false, error: 'Imóvel não encontrado.' }
  if (current.ownerId !== user.id) return { ok: false, error: 'Sem permissão.' }

  await writePropertyStatus(propertyId, parsed.data)

  revalidatePath('/painel/imoveis')
  revalidatePath('/imoveis')
  revalidatePath(`/imoveis/${current.slug}`)
  return { ok: true }
}
