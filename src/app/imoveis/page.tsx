import { AppMenu } from '@/components/app-menu'
import { BackendUnavailable } from '@/components/backend-unavailable'
import { BrandLink } from '@/components/brand-link'
import { Container } from '@/components/container'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { readBackend } from '@/lib/backend-read'
import { listProperties } from '@/lib/db'
import type { Property } from '@/shared'
import { Button, Card } from '@cbrl/design'
import { Search } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { FilterBar } from './_components/filter-bar'
import { PropertyCard } from './_components/property-card'
import { applyFilters, type ListingFilters } from './_data/filters'

export const metadata: Metadata = {
  title: 'Alugue em Manaus — Imovil',
  description:
    'Imóveis pra alugar em Manaus com o que importa no topo: preço total, bairro, distância e pet.',
}

type SearchParams = Promise<ListingFilters>

export default async function ListingPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const result = await readBackend('published properties', () =>
    listProperties({ status: 'published' }),
  )
  const all = result.ok ? result.data : []
  const filtered = applyFilters(all, sp)
  const neighborhoods = Array.from(new Set(all.map((p) => p.neighborhood))).sort()
  const kinds = Array.from(new Set(all.map((p) => p.kind)))

  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <Header>
        <BrandLink className="text-base font-bold tracking-tight md:text-lg">Imovil</BrandLink>
        <AppMenu />
      </Header>
      <Container width="wide" className="flex-1 px-4 py-5 md:px-6 md:py-8">
        <Hero />
        {result.ok ? (
          <Listing all={all} filtered={filtered} neighborhoods={neighborhoods} kinds={kinds} />
        ) : (
          <BackendUnavailable />
        )}
      </Container>
      <Footer />
    </main>
  )
}

type ListingProps = {
  all: Property[]
  filtered: Property[]
  neighborhoods: string[]
  kinds: Property['kind'][]
}

function Listing({ all, filtered, neighborhoods, kinds }: ListingProps) {
  return (
    <>
      <Suspense fallback={null}>
        <FilterBar
          neighborhoods={neighborhoods}
          kinds={kinds}
          totalCount={all.length}
          filteredCount={filtered.length}
        />
      </Suspense>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <section className="mt-6 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:mt-8 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((p, i) => (
            <PropertyCard key={p.slug} p={p} priority={i === 0} />
          ))}
        </section>
      )}
    </>
  )
}

function Hero() {
  return (
    <section className="pb-2 md:pb-4">
      <h1
        className="leading-tight tracking-tight"
        style={{ fontSize: 'clamp(1.75rem, 3.8vw, 2.75rem)', fontWeight: 700 }}
      >
        Alugue em Manaus
      </h1>
      <p className="text-muted-foreground mt-2 max-w-[52ch] text-sm md:text-base">
        Imóveis curados por corretores, com preço total, bairro e pet-friendly logo no topo. Fala
        com a gente direto no WhatsApp.
      </p>
    </section>
  )
}

function EmptyState() {
  return (
    <Card className="mt-10 flex flex-col items-center justify-center rounded-xl px-6 py-16 text-center">
      <Search className="text-muted-foreground mb-4 size-9" aria-hidden strokeWidth={1.6} />
      <h2 className="text-lg font-semibold tracking-tight">Nenhum imóvel com esses filtros</h2>
      <p className="text-muted-foreground mt-2 max-w-[40ch] text-sm">
        Tenta afrouxar o bairro, tirar o limite de preço, ou limpar os filtros e começar de novo.
      </p>
      <Button asChild variant="link" className="text-primary mt-3">
        <Link href="/imoveis">Limpar filtros</Link>
      </Button>
    </Card>
  )
}
