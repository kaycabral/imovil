// Dev seed for the local emulator: a handful of published properties so
// /imoveis has real content for manual testing (data is wiped on emulator
// stop). Mirrors the scheduling seed convention (idempotent + additive, run via
// `pnpm db:seed` while `pnpm db:start` is up). Clears this seed's own
// properties first, then re-creates a fixed set; never touches other owners.

import { getAdminAuth, getAdminDb } from '@imovil/db'
import type { PropertyCreateInput } from '@imovil/shared'

import { seedProfile, seedProperty } from '../e2e/seed'

const OWNER = {
  uid: 'dev-seed-broker',
  email: 'corretor.dev@imovil.local',
  displayName: 'Corretor Dev',
}
const PORT = 3003

type Listing = Pick<
  PropertyCreateInput,
  'kind' | 'deal' | 'title' | 'neighborhood' | 'price' | 'area' | 'rooms'
>

// `price` is stored in cents (centavos) — the UI divides by 100. Reais below.
const REAIS = 100

const LISTINGS: Listing[] = [
  {
    kind: 'apartment',
    deal: 'rental',
    title: 'Apartamento moderno no Adrianópolis',
    neighborhood: 'Adrianópolis',
    price: 2800 * REAIS,
    area: 75,
    rooms: 2,
  },
  {
    kind: 'house',
    deal: 'sale',
    title: 'Casa ampla no Aleixo',
    neighborhood: 'Aleixo',
    price: 650000 * REAIS,
    area: 180,
    rooms: 4,
  },
  {
    kind: 'studio',
    deal: 'rental',
    title: 'Studio aconchegante no Centro',
    neighborhood: 'Centro',
    price: 1500 * REAIS,
    area: 32,
    rooms: 1,
  },
  {
    kind: 'kitnet',
    deal: 'rental',
    title: 'Kitnet econômica na Cachoeirinha',
    neighborhood: 'Cachoeirinha',
    price: 900 * REAIS,
    area: 24,
    rooms: 1,
  },
  {
    kind: 'apartment',
    deal: 'sale',
    title: 'Apartamento com vista na Ponta Negra',
    neighborhood: 'Ponta Negra',
    price: 480000 * REAIS,
    area: 95,
    rooms: 3,
  },
  {
    kind: 'house',
    deal: 'rental',
    title: 'Casa com quintal nas Flores',
    neighborhood: 'Flores',
    price: 3500 * REAIS,
    area: 140,
    rooms: 3,
  },
]

async function clearSeedProperties(): Promise<number> {
  const db = getAdminDb()
  const snap = await db.collection('properties').where('ownerUid', '==', OWNER.uid).get()
  await Promise.all(snap.docs.map((d) => d.ref.delete()))
  return snap.size
}

// Create a Google-provider account in the Auth emulator so "Entrar → Continuar
// com Google" lets you pick this broker. Idempotent (skips if already present).
async function ensureOwnerAuth(): Promise<void> {
  const auth = getAdminAuth()
  try {
    await auth.getUser(OWNER.uid)
    return
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : undefined
    if (code !== 'auth/user-not-found') throw err
  }
  const result = await auth.importUsers([
    {
      uid: OWNER.uid,
      email: OWNER.email,
      emailVerified: true,
      displayName: OWNER.displayName,
      providerData: [
        {
          uid: OWNER.email,
          providerId: 'google.com',
          email: OWNER.email,
          displayName: OWNER.displayName,
        },
      ],
    },
  ])
  if (result.failureCount > 0) {
    throw new Error(`importUsers failed: ${result.errors.map((e) => e.error.message).join('; ')}`)
  }
}

async function seed(): Promise<void> {
  const removed = await clearSeedProperties()
  if (removed > 0) console.log(`Cleared ${removed} existing seed properties.`)

  await ensureOwnerAuth()
  await seedProfile(OWNER.uid, { displayName: OWNER.displayName, creci: 'CRECI-DEV-001' })

  for (const [i, listing] of LISTINGS.entries()) {
    const images = [
      {
        path: `seed/${i}.jpg`,
        src: `https://picsum.photos/seed/imovil-${i}/1200/800`,
        alt: listing.title,
      },
    ]
    const { slug } = await seedProperty({
      ownerUid: OWNER.uid,
      status: 'published',
      overrides: { ...listing, images },
    })
    console.log(
      `  seeded  ${listing.kind.padEnd(9)} ${listing.neighborhood.padEnd(14)} /imoveis/${slug}`,
    )
  }
}

seed()
  .then(() => {
    const line = '─'.repeat(64)
    console.log(`\n${line}`)
    console.log('✅ Seed concluído — Imovil')
    console.log(line)
    console.log(`  Listagem:     http://127.0.0.1:${PORT}/imoveis`)
    console.log(`  ${LISTINGS.length} imóveis publicados (apartment · house · studio · kitnet)`)
    console.log('  Variados por bairro, quartos e faixa de preço — bons pros filtros.')
    console.log(line)
    console.log(`  Entrar:       http://127.0.0.1:${PORT}  → "Entrar" → "Continuar com Google"`)
    console.log(`                → escolha "${OWNER.displayName}" (${OWNER.email})`)
    console.log(`  Painel:       http://127.0.0.1:${PORT}/painel  (após login)`)
    console.log(`${line}\n`)
    process.exit(0)
  })
  .catch((err: unknown) => {
    console.error('\n❌ Seed falhou:', err)
    console.error('\nO emulator está rodando? Suba com `pnpm db:start` antes.\n')
    process.exit(1)
  })
