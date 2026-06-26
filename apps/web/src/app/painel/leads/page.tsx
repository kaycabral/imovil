import { Container } from '@/components/container'
import { getFeatures } from '@/lib/features'
import { getPropertyBySlug } from '@/lib/properties/server'
import { Badge, Button, Card } from '@cbrl/design'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { FilterChip, FilterChipRow } from '../_components/filter-chip'
import { PageHeader } from '../_components/page-header'
import { countByStatus, leadStatusLabel, listLeads, type LeadStatus } from '../_data/leads'

const statusOrder: LeadStatus[] = ['novo', 'em-contato', 'visita-agendada', 'fechado', 'descartado']

function isLeadStatus(value: string | undefined): value is LeadStatus {
  return value !== undefined && (statusOrder as string[]).includes(value)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

type SearchParams = Promise<{ status?: string }>

export default async function LeadsListPage({ searchParams }: { searchParams: SearchParams }) {
  const features = await getFeatures()
  if (!features.leads) notFound()

  const sp = await searchParams
  const selected: 'todos' | LeadStatus = isLeadStatus(sp.status) ? sp.status : 'todos'

  const allLeads = listLeads()
  const leads = selected === 'todos' ? allLeads : allLeads.filter((l) => l.status === selected)
  const counts = countByStatus()
  const leadProperties = await Promise.all(leads.map((l) => getPropertyBySlug(l.propertySlug)))

  return (
    <Container className="p-5 md:p-8">
      <PageHeader
        title="Leads"
        description="Interessados nos seus imóveis. Atualize status conforme conversa avança."
      />
      <FilterChipRow>
        <FilterChip href="/painel/leads" active={selected === 'todos'}>
          Todos
          <span className="text-muted-foreground ml-1.5 text-[0.7rem] tabular-nums">
            {allLeads.length}
          </span>
        </FilterChip>
        {statusOrder.map((s) => (
          <FilterChip key={s} href={`/painel/leads?status=${s}`} active={selected === s}>
            {leadStatusLabel[s]}
            <span className="text-muted-foreground ml-1.5 text-[0.7rem] tabular-nums">
              {counts[s]}
            </span>
          </FilterChip>
        ))}
      </FilterChipRow>

      {leads.length === 0 ? (
        <Card className="mt-5 rounded-xl p-10 text-center">
          <p className="text-sm font-medium">Nenhum lead nesse status</p>
          <p className="text-muted-foreground mt-1 text-xs">
            Assim que algum cliente entrar em contato pelos imóveis, aparece aqui.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/painel/leads">Ver todos</Link>
          </Button>
        </Card>
      ) : (
        <Card className="mt-5 overflow-hidden rounded-xl p-0">
          <ul className="divide-y">
            {leads.map((lead, i) => {
              const prop = leadProperties[i] ?? null
              const waNumber = lead.phone.replace(/\D/g, '')
              const waText = `Olá ${lead.name.split(' ')[0]}, tudo bem?`
              return (
                <li
                  key={lead.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:gap-5 md:p-5"
                >
                  <div className="flex items-start gap-3 md:flex-1">
                    <div className="bg-secondary text-secondary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                      {lead.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="font-medium">{lead.name}</p>
                        <StatusBadge status={lead.status} />
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {formatDate(lead.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        Interesse em:{' '}
                        {prop ? (
                          <Link
                            href={`/imoveis/${prop.slug}` as never}
                            className="hover:text-foreground underline-offset-4 hover:underline"
                            target="_blank"
                          >
                            {prop.title}
                          </Link>
                        ) : (
                          lead.propertySlug
                        )}
                      </p>
                      {lead.note && (
                        <p className="text-muted-foreground mt-1.5 text-xs italic">"{lead.note}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-auto rounded-full px-3 py-1.5 text-xs"
                    >
                      <a
                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-auto rounded-full px-3 py-1.5 text-xs tabular-nums"
                    >
                      <a href={`tel:${waNumber}`}>{lead.phone}</a>
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </Container>
  )
}

function statusExtra(status: LeadStatus): string {
  if (status === 'novo') return 'bg-primary/15 text-primary hover:bg-primary/15'
  if (status === 'visita-agendada') return 'bg-primary/10 text-primary hover:bg-primary/10'
  if (status === 'descartado') return 'bg-muted text-muted-foreground hover:bg-muted'
  return ''
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const variant = status === 'novo' || status === 'visita-agendada' ? 'default' : 'secondary'
  const extra = statusExtra(status)
  return (
    <Badge variant={variant} className={`shrink-0 px-2 py-0.5 text-[0.65rem] ${extra}`}>
      {leadStatusLabel[status]}
    </Badge>
  )
}
