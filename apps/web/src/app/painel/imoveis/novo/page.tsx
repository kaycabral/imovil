import { Container } from '@/components/container'
import { getAdminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/server'
import type { Metadata } from 'next'
import { PageHeader } from '../../_components/page-header'
import { PropertyForm, type PropertyFormProfile } from '../_components/property-form'

export const metadata: Metadata = {
  title: 'Novo imóvel — Tekoa',
}

export default async function NewPropertyPage() {
  const user = await getServerUser()
  const profile: PropertyFormProfile = { uid: user?.uid ?? '', phone: null, creci: null }

  if (user) {
    const snap = await getAdminDb().collection('users').doc(user.uid).get()
    const data = snap.data() as { phone?: string; creci?: string } | undefined
    profile.phone = data?.phone ?? null
    profile.creci = data?.creci ?? null
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
