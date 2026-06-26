export type PropertyKind = 'apartment' | 'studio' | 'kitnet' | 'house'

export const propertyKindLabels: Record<PropertyKind, string> = {
  apartment: 'Apartamento',
  studio: 'Studio',
  kitnet: 'Kitnet',
  house: 'Casa',
}
export type PropertyDeal = 'rental' | 'sale'
export type PropertyStatus = 'published' | 'draft' | 'paused'
export type PropertyImageSpan = 'wide' | 'tall' | 'square'

export type PropertyImage = {
  path: string
  src: string
  alt: string
  span?: PropertyImageSpan
}

export type PropertyDetail = {
  label: string
  value: string
}

/**
 * Shape de exibição do corretor responsável no anúncio. NÃO é persistido no doc
 * `properties` — é composto em runtime a partir do doc `users/{ownerUid}`. Ficar
 * aqui porque o componente `<Broker>` consome.
 */
export type PropertyBroker = {
  name: string
  role: string
  creci: string
  phone: string
  whatsappText: string
  avatar: string | null
}

export type PropertyCoords = {
  lat: number
  lng: number
}

export type Property = {
  id: string
  slug: string
  ownerUid: string
  status: PropertyStatus
  kind: PropertyKind
  deal: PropertyDeal
  title: string
  subtitle: string
  postalCode: string
  street: string
  neighborhood: string
  city: string
  state: string
  /** Coordenadas arredondadas (~100m) pra privacidade; null quando geocoding falhou. */
  coords: PropertyCoords | null
  price: number
  condo: number
  iptu: number
  area: number
  rooms: number
  suites: number
  parking: number
  floor?: number
  petFriendly: boolean
  furnished: boolean
  transitDistanceMin: number
  transitLabel: string
  builtYear: number
  description: string[]
  details: PropertyDetail[]
  images: PropertyImage[]
  createdAt: string
  updatedAt: string
}
