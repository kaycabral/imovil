import type { Property } from '@imovil/shared'

export type ListingFilters = {
  q?: string
  kind?: string
  bairro?: string
  rooms?: string
  max?: string
  pet?: string
  furnished?: string
  parking?: string
  sort?: string
}

type DerivedFilters = { q: string; minRooms?: number; maxPrice?: number }

function matchesFilters(p: Property, sp: ListingFilters, derived: DerivedFilters): boolean {
  const { q, minRooms, maxPrice } = derived
  if (q) {
    const hay = `${p.title} ${p.subtitle} ${p.neighborhood} ${p.city}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  // Cada entrada é "filtro não setado OU a propriedade satisfaz". `.every`
  // mantém os gates de atributo planos em vez de uma cadeia de if/&&.
  const gates = [
    !sp.kind || p.kind === sp.kind,
    !sp.bairro || p.neighborhood === sp.bairro,
    !minRooms || p.rooms >= minRooms,
    !maxPrice || p.price <= maxPrice,
    sp.pet !== '1' || p.petFriendly,
    sp.furnished !== '1' || p.furnished,
    sp.parking !== '1' || p.parking !== 0,
  ]
  return gates.every(Boolean)
}

function compareListings(a: Property, b: Property, sort: string): number {
  if (sort === 'price-desc') return b.price - a.price
  if (sort === 'area-desc') return b.area - a.area
  if (sort === 'transit-asc') return a.transitDistanceMin - b.transitDistanceMin
  return a.price - b.price
}

export function applyFilters(list: Property[], sp: ListingFilters): Property[] {
  const q = sp.q?.trim().toLowerCase() ?? ''
  // `max` na URL é em reais (convenção do filtro); price no doc é em centavos.
  const maxPrice = sp.max ? Number(sp.max) * 100 : undefined
  const minRooms = sp.rooms ? Number(sp.rooms) : undefined
  const sort = sp.sort ?? 'price-asc'

  const filtered = list.filter((p) => matchesFilters(p, sp, { q, minRooms, maxPrice }))
  return [...filtered].sort((a, b) => compareListings(a, b, sort))
}
