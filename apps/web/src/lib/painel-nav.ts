import type { Features } from '@/lib/features'
import type { LucideIcon } from 'lucide-react'
import { Building2, LayoutDashboard, Users } from 'lucide-react'

export type NavItem = {
  href: '/painel' | '/painel/imoveis' | '/painel/leads'
  label: string
  shortLabel: string
  icon: LucideIcon
}

const ALL_ITEMS: NavItem[] = [
  {
    href: '/painel',
    label: 'Visão geral',
    shortLabel: 'Início',
    icon: LayoutDashboard,
  },
  {
    href: '/painel/imoveis',
    label: 'Meus imóveis',
    shortLabel: 'Imóveis',
    icon: Building2,
  },
  {
    href: '/painel/leads',
    label: 'Leads',
    shortLabel: 'Leads',
    icon: Users,
  },
]

export function getNavItems(features: Features): NavItem[] {
  return ALL_ITEMS.filter((item) => {
    if (item.href === '/painel/leads') return features.leads
    return true
  })
}

export function isActive(pathname: string, href: string) {
  if (href === '/painel') return pathname === '/painel'
  return pathname.startsWith(href)
}
