import { Container } from '@/components/container'
import { getServerUser } from '@/lib/auth/server'
import { getProfile, getPropertyById } from '@/lib/db'
import { maskPostalCode } from '@cbrl/br/postal-code'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '../../../_components/page-header'
import {
  PropertyForm,
  type PropertyFormInitial,
  type PropertyFormProfile,
} from '../../_components/property-form'

export const metadata: Metadata = {
  title: 'Editar imóvel — Imovil',
}

type PageProps = { params: Promise<{ id: string }> }

export default async function EditPropertyPage({ params }: PageProps) {
  const { id } = await params
  const user = await getServerUser()
  if (!user) notFound()

  const property = await getPropertyById(id)
  if (!property) notFound()
  if (property.ownerId !== user.id) notFound()

  const stored = await getProfile(user.id)
  const profile: PropertyFormProfile = {
    id: user.id,
    phone: stored?.phone ?? null,
    creci: stored?.creci ?? null,
  }

  const initial: PropertyFormInitial = {
    values: {
      kind: property.kind,
      deal: property.deal,
      title: property.title,
      subtitle: property.subtitle,
      postalCode: property.postalCode,
      street: property.street,
      neighborhood: property.neighborhood,
      state: property.state,
      city: property.city,
      price: property.price,
      condo: property.condo,
      iptu: property.iptu,
      area: property.area,
      rooms: property.rooms,
      suites: property.suites,
      parking: property.parking,
      floor: property.floor,
      petFriendly: property.petFriendly,
      furnished: property.furnished,
      transitDistanceMin: property.transitDistanceMin,
      transitLabel: property.transitLabel,
      builtYear: property.builtYear,
      descriptionText: property.description.join('\n\n'),
    },
    images: property.images,
    postalCodeInput: maskPostalCode(property.postalCode),
    postalCodeResult: property.postalCode
      ? {
          postalCode: property.postalCode,
          state: property.state,
          city: property.city,
          neighborhood: property.neighborhood,
          street: property.street,
        }
      : null,
  }

  return (
    <Container className="p-5 md:p-8">
      <PageHeader
        title="Editar imóvel"
        description="Atualize os dados e salve para refletir nos anúncios."
      />
      <PropertyForm profile={profile} mode="edit" propertyId={property.id} initial={initial} />
    </Container>
  )
}
