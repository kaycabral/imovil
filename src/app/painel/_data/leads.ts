export type LeadStatus = 'novo' | 'em-contato' | 'visita-agendada' | 'fechado' | 'descartado'

export type Lead = {
  id: string
  name: string
  phone: string
  propertySlug: string
  createdAt: string
  lastContactAt?: string
  status: LeadStatus
  note?: string
}

export const leadStatusLabel: Record<LeadStatus, string> = {
  novo: 'Novo',
  'em-contato': 'Em contato',
  'visita-agendada': 'Visita agendada',
  fechado: 'Fechado',
  descartado: 'Descartado',
}

export const leads: Lead[] = [
  {
    id: 'lead-001',
    name: 'Paulo Menezes',
    phone: '+55 92 98111-2200',
    propertySlug: 'apto-2-quartos-adrianopolis',
    createdAt: '2026-04-19T14:20:00-04:00',
    lastContactAt: '2026-04-20T10:05:00-04:00',
    status: 'visita-agendada',
    note: 'Vai visitar sábado 15h, levou a esposa e quer ver a vaga.',
  },
  {
    id: 'lead-002',
    name: 'Mariana Coelho',
    phone: '+55 92 99030-4411',
    propertySlug: 'studio-ponta-negra',
    createdAt: '2026-04-20T18:40:00-04:00',
    lastContactAt: '2026-04-20T19:10:00-04:00',
    status: 'em-contato',
    note: 'Precisa mobiliado, perguntou se entra em 2 semanas.',
  },
  {
    id: 'lead-003',
    name: 'Diego Farias',
    phone: '+55 92 98555-7799',
    propertySlug: 'apto-3-quartos-aleixo',
    createdAt: '2026-04-21T09:15:00-04:00',
    status: 'novo',
  },
  {
    id: 'lead-004',
    name: 'Rosa Silveira',
    phone: '+55 92 98122-0033',
    propertySlug: 'kitnet-centro',
    createdAt: '2026-04-18T11:00:00-04:00',
    lastContactAt: '2026-04-19T13:00:00-04:00',
    status: 'fechado',
    note: 'Contrato assinado dia 19. Entrada paga.',
  },
  {
    id: 'lead-005',
    name: 'Bruno Albuquerque',
    phone: '+55 92 99818-5050',
    propertySlug: 'apto-1-quarto-vieiralves',
    createdAt: '2026-04-21T16:30:00-04:00',
    status: 'novo',
  },
  {
    id: 'lead-006',
    name: 'Camila Reis',
    phone: '+55 92 98700-1122',
    propertySlug: 'apto-2-quartos-parque-10',
    createdAt: '2026-04-17T08:50:00-04:00',
    lastContactAt: '2026-04-18T14:00:00-04:00',
    status: 'em-contato',
  },
  {
    id: 'lead-007',
    name: 'Thiago Monteiro',
    phone: '+55 92 99612-4444',
    propertySlug: 'apto-2-quartos-adrianopolis',
    createdAt: '2026-04-16T12:20:00-04:00',
    lastContactAt: '2026-04-17T09:00:00-04:00',
    status: 'descartado',
    note: 'Não aprovou no seguro-fiança.',
  },
  {
    id: 'lead-008',
    name: 'Letícia Ramos',
    phone: '+55 92 98844-6677',
    propertySlug: 'casa-tarumã',
    createdAt: '2026-04-21T19:00:00-04:00',
    status: 'novo',
    note: 'Tem 2 cachorros médios, perguntou se a casa aceita.',
  },
]

export function listLeads(): Lead[] {
  return [...leads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function countByStatus(): Record<LeadStatus, number> {
  const base: Record<LeadStatus, number> = {
    novo: 0,
    'em-contato': 0,
    'visita-agendada': 0,
    fechado: 0,
    descartado: 0,
  }
  for (const l of leads) base[l.status]++
  return base
}
