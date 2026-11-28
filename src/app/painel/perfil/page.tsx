import { Container } from '@/components/container'
import { getServerUser } from '@/lib/auth/server'
import { getProfile } from '@/lib/db'
import type { Metadata } from 'next'
import { PageHeader } from '../_components/page-header'
import { ProfileForm, type ProfileFormValues } from './_components/profile-form'

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false

export const metadata: Metadata = {
  title: 'Perfil — Imovil',
}

export default async function ProfilePage() {
  const user = await getServerUser()
  const profile = user ? await getProfile(user.id) : null
  const initialValues: ProfileFormValues = {
    phone: profile?.phone ?? '',
    creci: profile?.creci ?? '',
  }

  return (
    <Container className="p-5 md:p-8">
      <PageHeader
        title="Perfil"
        description="Dados de contato usados nos seus anúncios. Nome e foto vêm da sua conta Google."
      />
      <ProfileForm
        displayName={user?.name ?? null}
        email={user?.email ?? null}
        avatarUrl={user?.avatarUrl ?? null}
        initialValues={initialValues}
      />
    </Container>
  )
}
