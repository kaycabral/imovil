import { Container } from '@/components/container'
import { getServerUser } from '@/lib/auth/server'
import { getPropertyBySlug, listProperties } from '@/lib/db'
import { getFeatures } from '@/lib/features'
import { formatBRLFromCents } from '@cbrl/br/money'
import { Badge, Button, Card, CardContent } from '@cbrl/design'
import Image from 'next/image'
import Link from 'next/link'
import { MetricCard } from './_components/metric-card'
import { PageHeader } from './_components/page-header'
import { countByStatus, leadStatusLabel, listLeads, type LeadStatus } from './_data/leads'

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export default async function DashboardOverviewPage() {
  const user = await getServerUser()
  const features = getFeatures()
  // `name` rides the DecodedIdToken index signature (`[key: string]: any`),
  // so narrow it at the read boundary before splitting.
  const userName = typeof user?.name === 'string' ? user.name : null
  const firstName = userName?.split(/\s+/)[0] ?? user?.email?.split('@')[0] ?? null
  const greeting = firstName ? `Olá, ${firstName}.` : 'Olá.'

  const properties = user ? await listProperties({ ownerId: user.id }) : []
  const recentProperties = properties.slice(0, 4)

  return (
    <Container className="p-5 md:p-8">
      <PageHeader
        title="Visão geral"
        description={`${greeting} Aqui está o resumo do seu portfólio hoje.`}
      />
      {features.leads ? (
        <LeadsAwareDashboard properties={properties} recentProperties={recentProperties} />
      ) : (
        <PropertiesOnlyDashboard properties={properties} recentProperties={recentProperties} />
      )}
    </Container>
  )
}

type Property = Awaited<ReturnType<typeof listProperties>>[number]

function PropertiesOnlyDashboard({
  properties,
  recentProperties,
}: {
  properties: Property[]
  recentProperties: Property[]
}) {
  return (
    <>
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard
          label="Imóveis publicados"
          value={properties.length}
          hint="na região de Manaus"
        />
        <MetricCard
          label="Rascunhos"
          value={properties.filter((p) => p.status === 'draft').length}
        />
      </section>
      <section className="mt-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Últimos imóveis</h2>
          <Button asChild variant="link" className="text-muted-foreground hover:text-foreground">
            <Link href="/painel/imoveis">Ver todos →</Link>
          </Button>
        </div>
        <PropertyGrid properties={recentProperties} />
      </section>
    </>
  )
}

async function LeadsAwareDashboard({
  properties,
  recentProperties,
}: {
  properties: Property[]
  recentProperties: Property[]
}) {
  const leads = listLeads()
  const recentLeads = leads.slice(0, 5)
  const recentLeadProperties = await Promise.all(
    recentLeads.map((l) => getPropertyBySlug(l.propertySlug)),
  )
  const counts = countByStatus()
  const totalLeads = leads.length
  const conversion = totalLeads ? Math.round((counts.fechado / totalLeads) * 100) : 0

  return (
    <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Imóveis publicados"
          value={properties.length}
          hint="na região de Manaus"
        />
        <MetricCard
          label="Leads novos"
          value={counts.novo}
          trend={{ direction: 'up', label: '+2 nas últimas 24h' }}
        />
        <MetricCard
          label="Visitas agendadas"
          value={counts['visita-agendada']}
          hint="próximos 7 dias"
        />
        <MetricCard
          label="Conversão"
          value={`${conversion}%`}
          trend={{
            direction: conversion >= 10 ? 'up' : 'flat',
            label: `${counts.fechado} fechados / ${totalLeads} leads`,
          }}
        />
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Últimos imóveis</h2>
            <Button asChild variant="link" className="text-muted-foreground hover:text-foreground">
              <Link href="/painel/imoveis">Ver todos →</Link>
            </Button>
          </div>
          <PropertyGrid properties={recentProperties} />
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Leads recentes</h2>
            <Button asChild variant="link" className="text-muted-foreground hover:text-foreground">
              <Link href="/painel/leads">Ver todos →</Link>
            </Button>
          </div>
          <Card className="overflow-hidden rounded-xl p-0">
            <ul className="divide-y">
              {recentLeads.map((lead, i) => {
                const prop = recentLeadProperties[i] ?? null
                return (
                  <li key={lead.id} className="flex items-start gap-3 p-4">
                    <div className="bg-secondary text-secondary-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                      {lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium">{lead.name}</p>
                        <StatusBadge status={lead.status} />
                      </div>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {prop ? prop.title : lead.propertySlug}
                      </p>
                      {lead.note && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs italic">
                          "{lead.note}"
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        </section>
      </div>
    </>
  )
}

function PropertyGrid({ properties }: { properties: Property[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {properties.map((p) => {
        const cover = p.images[0]
        const isRental = p.deal === 'rental'
        const total = p.price + p.condo + p.iptu
        return (
          <Link
            key={p.id}
            href={`/imoveis/${p.slug}` as never}
            className="group focus-visible:ring-primary/50 block rounded-xl focus:outline-none focus-visible:ring-2"
          >
            <Card className="group-hover:border-primary/40 overflow-hidden rounded-xl p-0 transition-colors">
              <figure className="bg-muted relative aspect-[5/3] overflow-hidden">
                {cover && (
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
                <Badge className="bg-background/90 text-foreground absolute top-3 left-3 backdrop-blur-sm">
                  Publicado
                </Badge>
              </figure>
              <CardContent className="p-4">
                <p className="text-muted-foreground text-xs">
                  {p.neighborhood}, {p.city}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-snug font-semibold tracking-tight">
                  {p.title}
                </p>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <span className="text-base font-bold tabular-nums">
                    {formatBRLFromCents(p.price)}
                    {isRental && (
                      <span className="text-muted-foreground ml-1 text-xs font-normal">/mês</span>
                    )}
                  </span>
                  {isRental && (
                    <span className="text-muted-foreground text-xs tabular-nums">
                      Total {formatBRLFromCents(total)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function statusVariant(status: LeadStatus): 'default' | 'secondary' {
  if (status === 'novo' || status === 'visita-agendada') return 'default'
  return 'secondary'
}

function statusExtra(status: LeadStatus): string {
  if (status === 'novo') return 'bg-primary/15 text-primary hover:bg-primary/15'
  if (status === 'visita-agendada') return 'bg-primary/10 text-primary hover:bg-primary/10'
  if (status === 'descartado') return 'bg-muted text-muted-foreground hover:bg-muted'
  return ''
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const variant = statusVariant(status)
  const extra = statusExtra(status)
  return (
    <Badge variant={variant} className={`shrink-0 px-2 py-0.5 text-[0.65rem] ${extra}`}>
      {leadStatusLabel[status]}
    </Badge>
  )
}
