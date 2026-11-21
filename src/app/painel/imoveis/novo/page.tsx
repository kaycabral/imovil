import { PageHeader } from '@/app/painel/_components/page-header'
import { Container } from '@/components/container'
import { getServerUser } from '@/lib/auth/server'
import { getProfile } from '@/lib/db'
import type { Metadata } from 'next'
import { PropertyForm, type PropertyFormProfile } from '../_components/property-form'

export const metadata: Metadata = {
  title: 'Novo imóvel — Imovil',
}

export default async function NewPropertyPage() {
  const user = await getServerUser()
  const stored = user ? await getProfile(user.id) : null
  const profile: PropertyFormProfile = {
    id: user?.id ?? '',
    phone: stored?.phone ?? null,
    creci: stored?.creci ?? null,
  }

  return (
    <Container className="p-5 md:p-8">
      <PageHeader
        title="Novo imóvel"
        description="Preencha os dados do imóvel. Ele entra como rascunho até você publicar."
      />
      <PropertyForm profile={profile} />
    </Container>
  )
}
