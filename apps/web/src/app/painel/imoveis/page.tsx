import { Container } from '@/components/container'
import { getServerUser } from '@/lib/auth/server'
import { listProperties } from '@/lib/db'
import { getFeatures } from '@/lib/features'
import { formatBRLFromCents } from '@/lib/money'
import { Badge, Button, Card, CardContent } from '@imovil/design'
import type { Property, PropertyStatus } from '@imovil/shared'
import { Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { FilterChip, FilterChipRow } from '../_components/filter-chip'
import { PageHeader } from '../_components/page-header'
import { PropertyStatusMenu } from './_components/property-status-menu'

const statusFilters: { value: 'todos' | PropertyStatus; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'paused', label: 'Pausados' },
]

const statusBadgeClass: Record<PropertyStatus, string> = {
  published: 'bg-primary/10 text-primary hover:bg-primary/10',
  draft: 'bg-muted text-muted-foreground hover:bg-muted',
  paused: 'bg-destructive/10 text-destructive hover:bg-destructive/10',
}

const statusLabel: Record<PropertyStatus, string> = {
  published: 'Publicado',
  draft: 'Rascunho',
  paused: 'Pausado',
}

type SearchParams = Promise<{ status?: string }>

function isPropertyStatusFilter(value: string | undefined): value is 'todos' | PropertyStatus {
  return value !== undefined && statusFilters.some((f) => f.value === value)
}

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const selected: 'todos' | PropertyStatus = isPropertyStatusFilter(sp.status) ? sp.status : 'todos'

  const user = await getServerUser()
  const features = getFeatures()
  const allProperties = user ? await listProperties({ ownerId: user.id }) : []
  const properties =
    selected === 'todos' ? allProperties : allProperties.filter((p) => p.status === selected)

  const counts = statusFilters.reduce<Record<string, number>>((acc, f) => {
    acc[f.value] =
      f.value === 'todos'
        ? allProperties.length
        : allProperties.filter((p) => p.status === f.value).length
    return acc
  }, {})

  return (
    <Container className="p-5 md:p-8">
      <PageHeader
        title="Meus imóveis"
        description={`${allProperties.length} imóveis no seu portfólio.`}
      />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <FilterChipRow>
          {statusFilters.map((f) => (
            <FilterChip
              key={f.value}
              href={`/painel/imoveis?status=${f.value}`}
              active={selected === f.value}
            >
              {f.label}
              <span className="text-muted-foreground ml-1.5 text-[0.7rem] tabular-nums">
                {counts[f.value] ?? 0}
              </span>
            </FilterChip>
          ))}
        </FilterChipRow>
        <Button asChild className="w-full md:w-auto">
          <Link href={'/painel/imoveis/novo'}>
            <Plus className="size-4" />
            Publicar imóvel
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <EmptyState status={selected} />
      ) : (
        <>
          {/* Mobile + tablet: stack of property cards */}
          <div className="mt-5 grid grid-cols-1 gap-3 lg:hidden">
            {properties.map((p) => (
              <MobilePropertyCard key={p.id} p={p} showLeads={features.leads} />
            ))}
          </div>

          {/* Desktop large (≥ lg): table */}
          <Card className="mt-5 hidden overflow-hidden rounded-xl p-0 lg:block">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-[140px]" />
                <col className="w-[140px]" />
                {features.leads && <col className="w-[80px]" />}
                <col className="w-[60px]" />
              </colgroup>
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr className="text-left text-xs tracking-wider uppercase">
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Valor</th>
                  {features.leads && <th className="px-4 py-3">Leads</th>}
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-border/60 divide-y">
                {properties.map((p) => {
                  const cover = p.images[0]
                  const status = p.status
                  return (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-muted relative h-12 w-16 shrink-0 overflow-hidden rounded-md">
                            {cover && (
                              <Image
                                src={cover.src}
                                alt={cover.alt}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-1 font-medium">{p.title}</p>
                            <p className="text-muted-foreground line-clamp-1 text-xs">
                              {p.neighborhood} · {p.area} m² · {p.rooms}{' '}
                              {p.rooms === 1 ? 'quarto' : 'quartos'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={statusBadgeClass[status]}>{statusLabel[status]}</Badge>
                      </td>
                      <td className="px-4 py-3 font-medium tabular-nums">
                        {formatBRLFromCents(p.price)}
                        {p.deal === 'rental' && (
                          <span className="text-muted-foreground ml-1 text-xs font-normal">
                            /mês
                          </span>
                        )}
                      </td>
                      {features.leads && (
                        <td className="text-muted-foreground px-4 py-3 tabular-nums">0</td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <PropertyStatusMenu id={p.id} status={p.status} slug={p.slug} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </Container>
  )
}

function MobilePropertyCard({ p, showLeads }: { p: Property; showLeads: boolean }) {
  const cover = p.images[0]
  const status = p.status
  return (
    <Card className="overflow-hidden rounded-xl p-0">
      <CardContent className="flex gap-3 p-3">
        <div className="bg-muted relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg">
          {cover && (
            <Image src={cover.src} alt={cover.alt} fill sizes="112px" className="object-cover" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 flex-1 text-sm leading-snug font-medium">{p.title}</p>
            <Badge className={`${statusBadgeClass[status]} shrink-0 text-[0.65rem]`}>
              {statusLabel[status]}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            {p.neighborhood} · {p.area} m² · {p.rooms} {p.rooms === 1 ? 'quarto' : 'quartos'}
          </p>
          <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
            <span className="text-sm font-bold tabular-nums">
              {formatBRLFromCents(p.price)}
              {p.deal === 'rental' && (
                <span className="text-muted-foreground text-xs font-normal">/mês</span>
              )}
            </span>
            {showLeads && (
              <span className="text-muted-foreground text-xs tabular-nums">0 leads</span>
            )}
          </div>
        </div>
        <div className="self-start">
          <PropertyStatusMenu id={p.id} status={p.status} slug={p.slug} />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ status }: { status: 'todos' | PropertyStatus }) {
  const label = statusFilters.find((f) => f.value === status)?.label.toLowerCase() ?? status
  return (
    <Card className="mt-5 rounded-xl p-10 text-center">
      <p className="text-sm font-medium">Nenhum imóvel em {label}</p>
      <p className="text-muted-foreground mt-1 text-xs">
        Publique novos imóveis ou ajuste o filtro.
      </p>
      <Button asChild variant="link" className="mt-2">
        <Link href="/painel/imoveis">Ver todos</Link>
      </Button>
    </Card>
  )
}
