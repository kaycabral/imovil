import { AppMenu } from '@/components/app-menu'
import { BackendUnavailable } from '@/components/backend-unavailable'
import { BrandLink } from '@/components/brand-link'
import { Container } from '@/components/container'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { getServerUser } from '@/lib/auth/server'
import { readBackend } from '@/lib/backend-read'
import { getPropertyBySlug } from '@/lib/db'
import { getBrokerById } from '@/lib/properties/broker'
import type { Property } from '@/shared'
import { formatBRLFromCents } from '@cbrl/br/money'
import { Badge, Button, Card, CardContent } from '@cbrl/design'
import { Car, MapPin, Package, PawPrint } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { Broker } from './_components/broker'
import { Gallery } from './_components/gallery'
import { PropertyMap } from './_components/property-map'

type PageProps = { params: Promise<{ slug: string }> }

// Shared by generateMetadata + the page so one request reads the database once.
const loadProperty = cache((slug: string) =>
  readBackend(`property ${slug}`, () => getPropertyBySlug(slug)),
)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await loadProperty(slug)
  if (!result.ok) return { title: 'Imovil' }
  const p = result.data
  if (!p) return { title: 'Imóvel não encontrado — Imovil' }
  return {
    title: `${p.title} — Imovil`,
    description: p.subtitle,
    openGraph: {
      title: p.title,
      description: p.subtitle,
      images: [{ url: p.images[0]?.src ?? '' }],
    },
  }
}

export default async function PropertyPage({ params }: PageProps) {
  const { slug } = await params
  const result = await loadProperty(slug)
  if (!result.ok) return <UnavailablePage />
  const property = result.data
  if (!property) notFound()

  const viewer = await getServerUser()
  const isOwner = viewer?.id === property.ownerId
  // Imóveis não publicados só aparecem pro dono — evita "vazar" rascunho via URL direta.
  if (property.status !== 'published' && !isOwner) notFound()
  const showOwnerStatusNotice = isOwner && property.status !== 'published'

  // Broker card is optional: if the profile read fails the listing still renders.
  const brokerRead = await readBackend('broker', () => getBrokerById(property.ownerId))
  const broker = brokerRead.ok ? brokerRead.data : null

  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <Header>
        <BrandLink className="text-base font-bold tracking-tight md:text-lg">Imovil</BrandLink>
        <AppMenu />
      </Header>
      {showOwnerStatusNotice && <OwnerStatusBanner status={property.status} />}
      <Container as="article" className="flex-1 p-5 md:p-8">
        <Breadcrumbs property={property} />
        <TitleBlock property={property} />
        <Gallery images={property.images} />
        <div className="mt-10 grid gap-10 md:mt-12 md:grid-cols-[1fr_380px] md:gap-12">
          <div className="min-w-0">
            <Facts property={property} />
            <Description property={property} />
            <Details details={property.details} />
            <LocationBlock property={property} />
          </div>
          <aside className="md:sticky md:top-6 md:self-start">
            <PriceCard property={property} />
            {broker && (
              <div className="mt-4">
                <Broker {...broker} />
              </div>
            )}
          </aside>
        </div>
      </Container>
      <Footer />
    </main>
  )
}

function UnavailablePage() {
  return (
    <main className="bg-background text-foreground flex min-h-screen flex-col">
      <Header>
        <BrandLink className="text-base font-bold tracking-tight md:text-lg">Imovil</BrandLink>
        <AppMenu />
      </Header>
      <Container className="flex-1 p-5 md:p-8">
        <BackendUnavailable title="Não conseguimos carregar este imóvel agora" />
      </Container>
      <Footer />
    </main>
  )
}

function OwnerStatusBanner({ status }: { status: Property['status'] }) {
  const copy =
    status === 'draft'
      ? {
          title: 'Este imóvel está em rascunho.',
          body: 'Só você consegue ver esta página. Publique em "Meus imóveis" para que apareça na listagem.',
        }
      : {
          title: 'Este imóvel está pausado.',
          body: 'O anúncio não aparece na listagem pública. Reative em "Meus imóveis" quando quiser voltar.',
        }
  return (
    <div className="sticky top-0 z-40 border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="mx-auto max-w-[1400px] px-4 py-2.5 md:px-6">
        <p className="text-sm">
          <span className="font-semibold">{copy.title}</span>{' '}
          <span className="opacity-90">{copy.body}</span>
        </p>
      </div>
    </div>
  )
}

function Breadcrumbs({ property }: { property: Property }) {
  return (
    <nav className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Link href="/" className="hover:text-foreground">
        Imóveis
      </Link>
      <span>/</span>
      <span className="hover:text-foreground">{property.city}</span>
      <span>/</span>
      <span className="text-foreground">{property.neighborhood}</span>
    </nav>
  )
}

function TitleBlock({ property }: { property: Property }) {
  return (
    <section className="mt-3">
      <h1
        className="font-sans leading-tight tracking-tight"
        style={{
          fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
          fontWeight: 700,
          overflowWrap: 'break-word',
        }}
      >
        {property.title}
      </h1>
      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>
            {property.neighborhood}, {property.city}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 12h18M12 3v18" />
          </svg>
          {property.transitDistanceMin} min de {property.transitLabel.replace(/\s*\(.*\)\s*/, '')}
        </span>
      </div>
    </section>
  )
}

function Facts({ property }: { property: Property }) {
  const facts = [
    { label: 'Área útil', value: `${property.area} m²` },
    { label: 'Quartos', value: String(property.rooms) },
    { label: 'Banheiros', value: '1' },
    { label: 'Vaga', value: property.parking > 0 ? `${property.parking}` : 'Não' },
    { label: 'Andar', value: property.floor ? `${property.floor}º` : '—' },
    { label: 'Ano', value: `${property.builtYear}` },
  ]
  return (
    <section>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={property.petFriendly ? 'default' : 'outline'}
          className={`gap-1.5 px-3 py-1.5 text-xs ${
            property.petFriendly ? 'bg-primary/10 text-primary border-primary/30' : ''
          }`}
        >
          <PawPrint className="size-3.5" />
          {property.petFriendly ? 'Aceita pet' : 'Não aceita pet'}
        </Badge>
        <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
          <MapPin className="size-3.5" />
          {property.transitDistanceMin} min de {property.transitLabel.replace(/\s*\(.*\)\s*/, '')}
        </Badge>
        {property.parking > 0 && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
            <Car className="size-3.5" />
            {property.parking} vaga
          </Badge>
        )}
        {!property.furnished && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs">
            <Package className="size-3.5" />
            Sem mobília
          </Badge>
        )}
      </div>
      <Card className="mt-6">
        <CardContent className="grid grid-cols-3 gap-y-5 p-5 text-sm md:grid-cols-6 md:p-6">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-muted-foreground text-xs">{f.label}</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums">{f.value}</dd>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

function Description({ property }: { property: Property }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">Sobre o imóvel</h2>
      <div className="mt-3 space-y-4 text-[0.975rem] leading-[1.65]">
        {property.description.map((p, i) => (
          <p key={i} style={{ maxWidth: '68ch' }}>
            {p}
          </p>
        ))}
      </div>
    </section>
  )
}

function Details({ details }: { details: { label: string; value: string }[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">Ficha do imóvel</h2>
      <Card className="mt-4 rounded-xl p-0">
        <dl className="divide-y">
          {details.map((d) => (
            <div
              key={d.label}
              className="flex items-baseline justify-between gap-4 px-5 py-3.5 text-sm md:px-6"
            >
              <dt className="text-muted-foreground">{d.label}</dt>
              <dd className="text-right font-medium tabular-nums">{d.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </section>
  )
}

function LocationBlock({ property }: { property: Property }) {
  return (
    <section className="mt-10" id="contact">
      <h2 className="text-lg font-semibold tracking-tight md:text-xl">Onde fica</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        {property.neighborhood}, {property.city} · {property.transitLabel}
      </p>
      <div className="mt-4">
        {property.coords ? (
          <PropertyMap coords={property.coords} />
        ) : (
          <div className="bg-muted border-border/60 flex aspect-[16/10] w-full items-center justify-center rounded-xl border">
            <p className="text-muted-foreground text-sm">
              Localização no mapa não disponível para este imóvel.
            </p>
          </div>
        )}
      </div>
      <p className="text-muted-foreground mt-3 text-xs">
        A área no mapa é aproximada (~300m). Endereço completo é enviado após confirmação da visita.
      </p>
    </section>
  )
}

function PriceCard({ property }: { property: Property }) {
  const isRental = property.deal === 'rental'
  const total = property.price + property.condo + property.iptu
  return (
    <Card className="rounded-xl">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums md:text-[1.75rem]">
            {formatBRLFromCents(property.price)}
          </span>
          {isRental && <span className="text-muted-foreground text-sm">/mês</span>}
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs">{isRental ? 'Aluguel' : 'Venda'}</p>

        <dl className="mt-4 space-y-2 text-sm">
          <Row label={isRental ? 'Aluguel' : 'Valor'} value={formatBRLFromCents(property.price)} />
          <Row label="Condomínio" value={formatBRLFromCents(property.condo)} />
          <Row label="IPTU" value={formatBRLFromCents(property.iptu)} />
          {isRental && (
            <div className="border-border/60 !mt-3 flex items-baseline justify-between border-t pt-3">
              <dt className="font-semibold">Total mensal</dt>
              <dd className="text-base font-bold tabular-nums">{formatBRLFromCents(total)}</dd>
            </div>
          )}
        </dl>

        <Button className="mt-5 w-full">Agendar visita</Button>
        <p className="text-muted-foreground mt-2.5 text-center text-xs">
          Sem compromisso · resposta em até 2h em dias úteis
        </p>
      </CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
