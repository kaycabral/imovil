import {
  getProfile,
  getPropertyById,
  imovilDb,
  seedProperty as insertSeedProperty,
  listProperties,
  updateProfileContact,
} from '@/db'
import { propertyCreateSchema, type PropertyCreateInput, type PropertyStatus } from '@/shared'
import { createClient } from '@supabase/supabase-js'

/** Admin (secret-key) client for the LOCAL stack. Env set by playwright.config / seed script. */
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export type AuthUserInput = { email: string; password: string; displayName: string }

/**
 * (Re)create a password user in the LOCAL stack. The `on_auth_user_created`
 * trigger creates its profile. Recreating keeps every run independent.
 */
export async function recreateAuthUser(input: AuthUserInput): Promise<string> {
  const admin = adminClient().auth.admin
  const { data: list, error: listError } = await admin.listUsers({ page: 1, perPage: 1000 })
  if (listError) throw listError
  const existing = list.users.find((u) => u.email === input.email)
  if (existing) {
    const { error } = await admin.deleteUser(existing.id)
    if (error) throw error
  }
  const { data, error } = await admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.displayName },
  })
  if (error) throw error
  return data.user.id
}

export async function seedProfile(
  userId: string,
  data: { phone?: string; creci?: string } = {},
): Promise<void> {
  const saved = await updateProfileContact(userId, {
    phone: data.phone ?? '92999990000',
    creci: data.creci ?? 'CRECI-E2E-123',
  })
  if (!saved) throw new Error(`seedProfile: no profile for ${userId}`)
}

const defaultInput: PropertyCreateInput = propertyCreateSchema.parse({
  kind: 'apartment',
  deal: 'rental',
  title: 'Apartamento de teste',
  postalCode: '69000000',
  street: 'Rua de Teste',
  neighborhood: 'Centro',
  city: 'Manaus',
  state: 'AM',
  price: 2000,
  area: 60,
  rooms: 2,
  builtYear: 2020,
  description: ['Descrição de teste gerada pelo seed E2E.'],
  images: [
    { path: 'e2e/test.jpg', src: 'https://picsum.photos/seed/imovil-e2e/1200/800', alt: 'Foto' },
  ],
})

function slugify(s: string): string {
  return s
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

export type SeedPropertyInput = {
  ownerId: string
  status?: PropertyStatus
  coords?: { lat: number; lng: number } | null
  overrides?: Partial<PropertyCreateInput>
}

export type SeededProperty = { id: string; slug: string }

export async function seedProperty(input: SeedPropertyInput): Promise<SeededProperty> {
  // Parse catches drift between seed defaults and PropertyCreateInput shape —
  // any schema change in `@/shared` that breaks the seed fails loudly here.
  const { floor, ...data } = propertyCreateSchema.parse({ ...defaultInput, ...input.overrides })
  const coords = input.coords === undefined ? { lat: -3.1, lng: -60.02 } : input.coords
  const slug = `${slugify(data.title) || 'imovel'}-${randomSuffix()}`
  const id = await insertSeedProperty(imovilDb.db(), {
    ...data,
    floor: floor ?? null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    ownerId: input.ownerId,
    slug,
    status: input.status ?? 'draft',
  })
  return { id, slug }
}

export { getProfile, getPropertyById, listProperties }
