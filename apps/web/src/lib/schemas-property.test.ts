import { propertyCreateSchema } from '@tekoa/shared'
import { describe, expect, it } from 'vitest'

function validInput() {
  return {
    kind: 'apartment' as const,
    deal: 'rental' as const,
    title: 'Apartamento teste',
    subtitle: '',
    postalCode: '69057070',
    street: 'Rua Teste',
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
    transitDistanceMin: 0,
    transitLabel: '',
    builtYear: 2020,
    description: ['Descrição'],
    details: [],
    images: [
      {
        path: 'properties/uid/tmp/a.jpg',
        src: 'https://firebasestorage.googleapis.com/fake.jpg',
        alt: 'a',
      },
    ],
  }
}

describe('propertyCreateSchema', () => {
  it('aceita um input válido', () => {
    const result = propertyCreateSchema.safeParse(validInput())
    expect(result.success).toBe(true)
  })

  it('rejeita title com menos de 3 caracteres', () => {
    const result = propertyCreateSchema.safeParse({ ...validInput(), title: 'ab' })
    expect(result.success).toBe(false)
  })

  it('rejeita price zero ou negativo', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), price: 0 }).success).toBe(false)
    expect(propertyCreateSchema.safeParse({ ...validInput(), price: -1 }).success).toBe(false)
  })

  it('rejeita area zero ou negativa', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), area: 0 }).success).toBe(false)
  })

  it('rejeita state com tamanho diferente de 2', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), state: 'AMA' }).success).toBe(false)
    expect(propertyCreateSchema.safeParse({ ...validInput(), state: 'A' }).success).toBe(false)
  })

  it('rejeita postalCode que não tem 8 dígitos', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), postalCode: '1234567' }).success).toBe(
      false,
    )
    expect(
      propertyCreateSchema.safeParse({ ...validInput(), postalCode: '12345-678' }).success,
    ).toBe(false)
  })

  it('rejeita kind inválido', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), kind: 'mansion' }).success).toBe(false)
  })

  it('rejeita deal inválido', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), deal: 'aluguel' }).success).toBe(false)
  })

  it('exige pelo menos 1 imagem', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), images: [] }).success).toBe(false)
  })

  it('exige pelo menos 1 parágrafo de descrição', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), description: [] }).success).toBe(false)
  })

  it('rejeita rooms negativo mas aceita zero', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), rooms: 0 }).success).toBe(true)
    expect(propertyCreateSchema.safeParse({ ...validInput(), rooms: -1 }).success).toBe(false)
  })

  it('rejeita builtYear fora de [1900, 2100]', () => {
    expect(propertyCreateSchema.safeParse({ ...validInput(), builtYear: 1800 }).success).toBe(false)
    expect(propertyCreateSchema.safeParse({ ...validInput(), builtYear: 2200 }).success).toBe(false)
  })

  it('aplica defaults para campos com .default()', () => {
    const minimal = {
      kind: 'apartment' as const,
      deal: 'rental' as const,
      title: 'Título ok',
      postalCode: '12345678',
      street: '',
      neighborhood: 'Bairro',
      city: 'Cidade',
      state: 'AM',
      price: 100,
      area: 1,
      rooms: 1,
      builtYear: 2020,
      description: ['x'],
      images: [{ path: 'p', src: 'https://x/y.jpg', alt: 'a' }],
      petFriendly: false,
      furnished: false,
      condo: 0,
      iptu: 0,
      suites: 0,
      parking: 0,
      transitDistanceMin: 0,
    }
    const parsed = propertyCreateSchema.safeParse(minimal)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.subtitle).toBe('')
      expect(parsed.data.transitLabel).toBe('')
      expect(parsed.data.details).toEqual([])
    }
  })
})
