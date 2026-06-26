import { FieldValue, getAdminDb } from '@tekoa/db'
import { propertyCreateSchema, type PropertyCreateInput, type PropertyStatus } from '@tekoa/shared'

type SeedProfileInput = {
  phone?: string
  creci?: string
  displayName?: string
  avatarUrl?: string | null
}

export async function seedProfile(uid: string, data: SeedProfileInput = {}): Promise<void> {
  await getAdminDb()
    .collection('users')
    .doc(uid)
    .set(
      {
        displayName: data.displayName ?? 'Broker E2E',
        avatarUrl: data.avatarUrl ?? null,
        phone: data.phone ?? '92999990000',
        creci: data.creci ?? 'CRECI-E2E-123',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
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
  images: [{ path: 'e2e/test.jpg', src: 'http://127.0.0.1:9199/test.jpg', alt: 'Foto de teste' }],
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
  ownerUid: string
  status?: PropertyStatus
  coords?: { lat: number; lng: number } | null
  overrides?: Partial<PropertyCreateInput>
}

export type SeededProperty = { id: string; slug: string }

export async function seedProperty(input: SeedPropertyInput): Promise<SeededProperty> {
  // Parse catches drift between seed defaults and PropertyCreateInput shape —
  // any schema change in @tekoa/shared that breaks the seed fails loudly here.
  const data = propertyCreateSchema.parse({ ...defaultInput, ...input.overrides })

  const db = getAdminDb()
  const ref = db.collection('properties').doc()
  const slug = `${slugify(data.title) || 'imovel'}-${randomSuffix()}`

  // `broker` é exigido pelo shape atual do doc (copiado em createProperty).
  // Seedamos com o mesmo shape pra manter o spec agnóstico de como a [slug]
  // page compõe o contato — se o repo migrar pra lookup dinâmico via
  // `getBrokerByUid`, o campo extra fica ignorado sem quebrar os testes.
  const broker = {
    name: 'Broker E2E',
    role: 'Corretor responsável',
    creci: 'CRECI-E2E-123',
    phone: '92999990000',
    whatsappText: 'Olá, vi o imóvel pelo Tekoa e queria agendar uma visita.',
    avatar: 'http://127.0.0.1:9199/broker-avatar.jpg',
  }

  await ref.set({
    ...data,
    broker,
    coords: input.coords === undefined ? { lat: -3.1, lng: -60.02 } : input.coords,
    ownerUid: input.ownerUid,
    slug,
    status: input.status ?? 'draft',
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return { id: ref.id, slug }
}
