// Dev seed for the LOCAL Supabase stack: a broker with a password login and a
// handful of published properties so /imoveis has real content for manual
// testing. Recreates its own user (cascading away its previous properties) on
// every run; never touches other owners. Reads URL/keys/database from
// `supabase status`, so it can only ever target the local stack.

import { imovilDb } from '@/db'
import type { PropertyCreateInput } from '@/shared'
import { readLocalSupabase } from '@cbrl/supabase/local'

import { recreateAuthUser, seedProfile, seedProperty } from '@e2e/seed'

const local = readLocalSupabase()
Object.assign(process.env, {
  NEXT_PUBLIC_SUPABASE_URL: local.apiUrl,
  SUPABASE_SECRET_KEY: local.secretKey,
  POSTGRES_URL: local.dbUrl,
})

const OWNER = {
  email: 'corretor.dev@imovil.local',
  password: 'imovil-dev-password',
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

async function seed(): Promise<void> {
  const ownerId = await recreateAuthUser(OWNER)
  await seedProfile(ownerId, { creci: 'CRECI-DEV-001' })

  for (const [i, listing] of LISTINGS.entries()) {
    const images = [
      {
        path: `seed/${i}.jpg`,
        src: `https://picsum.photos/seed/imovil-${i}/1200/800`,
        alt: listing.title,
      },
    ]
    const { slug } = await seedProperty({
      ownerId,
      status: 'published',
      overrides: { ...listing, images },
    })
    console.log(
      `  seeded  ${listing.kind.padEnd(9)} ${listing.neighborhood.padEnd(14)} /imoveis/${slug}`,
    )
  }
}

async function main(): Promise<void> {
  try {
    await seed()
    const line = '─'.repeat(64)
    console.log(`\n${line}`)
    console.log('✅ Seed concluído — Imovil')
    console.log(line)
    console.log(`  Listagem:     http://localhost:${PORT}/imoveis`)
    console.log(`  ${LISTINGS.length} imóveis publicados (apartment · house · studio · kitnet)`)
    console.log(line)
    console.log('  Login local (Google não roda sem OAuth client): com ENABLE_TEST_AUTH=true')
    console.log('  no .env.local, rode no console do navegador em localhost:3003:')
    console.log(
      `    await fetch('/api/e2e-signin', { method: 'POST', body: JSON.stringify({ email: '${OWNER.email}', password: '${OWNER.password}' }) })`,
    )
    console.log(`  Studio:       ${local.apiUrl.replace('54321', '54323')}`)
    console.log(`${line}\n`)
  } catch (err) {
    console.error('\n❌ Seed falhou:', err)
    console.error('\nO stack local está rodando? Suba com `pnpm db:start` antes.\n')
    process.exitCode = 1
  } finally {
    await imovilDb.close()
  }
}

void main()
