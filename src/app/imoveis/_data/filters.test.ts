import type { Property } from '@/shared'
import { describe, expect, it } from 'vitest'
import { applyFilters } from './filters'

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'id',
    slug: 'slug',
    ownerId: 'u',
    status: 'published',
    kind: 'apartment',
    deal: 'rental',
    title: 'Apartamento teste',
    subtitle: '',
    postalCode: '00000000',
    street: '',
    neighborhood: 'Adrianópolis',
    city: 'Manaus',
    state: 'AM',
    price: 280000,
    condo: 0,
    iptu: 0,
    area: 50,
    rooms: 2,
    suites: 0,
    parking: 0,
    petFriendly: false,
    furnished: false,
    transitDistanceMin: 10,
    transitLabel: 'Av.',
    builtYear: 2020,
    description: ['x'],
    details: [],
    images: [{ path: 'p', src: 'https://x/y', alt: 'a' }],
    coords: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('applyFilters', () => {
  it('retorna tudo quando não há filtro', () => {
    const list = [makeProperty({ id: 'a' }), makeProperty({ id: 'b', price: 100000 })]
    expect(applyFilters(list, {})).toHaveLength(2)
  })

  it('filtra por query em title/subtitle/bairro/cidade (case-insensitive)', () => {
    const list = [
      makeProperty({ id: 'a', title: 'Linda casa na praia' }),
      makeProperty({ id: 'b', title: 'Apartamento no centro' }),
    ]
    const result = applyFilters(list, { q: 'PRAIA' })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('a')
  })

  it('filtra por kind', () => {
    const list = [
      makeProperty({ id: 'a', kind: 'apartment' }),
      makeProperty({ id: 'b', kind: 'house' }),
    ]
    const result = applyFilters(list, { kind: 'house' })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('b')
  })

  it('filtra por bairro', () => {
    const list = [
      makeProperty({ id: 'a', neighborhood: 'Adrianópolis' }),
      makeProperty({ id: 'b', neighborhood: 'Ponta Negra' }),
    ]
    const result = applyFilters(list, { bairro: 'Ponta Negra' })
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('b')
  })

  it('max em reais compara contra price em centavos', () => {
    const list = [
      makeProperty({ id: 'cheap', price: 150000 }),
      makeProperty({ id: 'mid', price: 280000 }),
      makeProperty({ id: 'expensive', price: 500000 }),
    ]
    const result = applyFilters(list, { max: '3000' })
    expect(result.map((p) => p.id).sort()).toEqual(['cheap', 'mid'])
  })

  it('filtra por rooms mínimo', () => {
    const list = [
      makeProperty({ id: 'small', rooms: 1 }),
      makeProperty({ id: 'medium', rooms: 2 }),
      makeProperty({ id: 'big', rooms: 3 }),
    ]
    const result = applyFilters(list, { rooms: '2' })
    expect(result.map((p) => p.id)).toEqual(['medium', 'big'])
  })

  it('pet=1 mantém só petFriendly', () => {
    const list = [
      makeProperty({ id: 'a', petFriendly: true }),
      makeProperty({ id: 'b', petFriendly: false }),
    ]
    expect(applyFilters(list, { pet: '1' }).map((p) => p.id)).toEqual(['a'])
  })

  it('parking=1 exclui propriedades com 0 vagas', () => {
    const list = [makeProperty({ id: 'nope', parking: 0 }), makeProperty({ id: 'one', parking: 1 })]
    expect(applyFilters(list, { parking: '1' }).map((p) => p.id)).toEqual(['one'])
  })

  it('ordena por price-asc por padrão', () => {
    const list = [
      makeProperty({ id: 'expensive', price: 500000 }),
      makeProperty({ id: 'cheap', price: 100000 }),
      makeProperty({ id: 'mid', price: 300000 }),
    ]
    expect(applyFilters(list, {}).map((p) => p.id)).toEqual(['cheap', 'mid', 'expensive'])
  })

  it('ordena por price-desc', () => {
    const list = [
      makeProperty({ id: 'cheap', price: 100000 }),
      makeProperty({ id: 'expensive', price: 500000 }),
    ]
    expect(applyFilters(list, { sort: 'price-desc' }).map((p) => p.id)).toEqual([
      'expensive',
      'cheap',
    ])
  })

  it('ordena por area-desc', () => {
    const list = [makeProperty({ id: 'small', area: 30 }), makeProperty({ id: 'big', area: 120 })]
    expect(applyFilters(list, { sort: 'area-desc' }).map((p) => p.id)).toEqual(['big', 'small'])
  })

  it('empilha filtros (bairro + pet + rooms)', () => {
    const list = [
      makeProperty({ id: 'a', neighborhood: 'Centro', petFriendly: true, rooms: 2 }),
      makeProperty({ id: 'b', neighborhood: 'Centro', petFriendly: false, rooms: 2 }),
      makeProperty({ id: 'c', neighborhood: 'Centro', petFriendly: true, rooms: 1 }),
    ]
    const result = applyFilters(list, { bairro: 'Centro', pet: '1', rooms: '2' })
    expect(result.map((p) => p.id)).toEqual(['a'])
  })
})
