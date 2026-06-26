import { Container } from '@/components/container'
import { getAdminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/server'
import type { Metadata } from 'next'
import { PageHeader } from '../_components/page-header'
import { ProfileForm, type ProfileFormValues } from './_components/profile-form'

export const metadata: Metadata = {
  title: 'Perfil — Tekoa',
}

export default async function ProfilePage() {
  const user = await getServerUser()
  const email = user?.email ?? null
  // `name` rides the DecodedIdToken index signature (`[key: string]: any`).
  const displayName = typeof user?.name === 'string' ? user.name : null
  const avatarUrl = user?.picture ?? null

  let phone: string | null = null
  let creci: string | null = null
  if (user) {
    const snap = await getAdminDb().collection('users').doc(user.uid).get()
    const data = snap.data() as { phone?: string; creci?: string } | undefined
    phone = data?.phone ?? null
    creci = data?.creci ?? null
  }

  const initialValues: ProfileFormValues = { phone: phone ?? '', creci: creci ?? '' }

  return (
    <Container className="p-5 md:p-8">
      <PageHeader
        title="Perfil"
        description="Dados de contato usados nos seus anúncios. Nome e foto vêm da sua conta Google."
      />
      <ProfileForm
        uid={user?.uid ?? ''}
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
        initialValues={initialValues}
      />
    </Container>
  )
}
