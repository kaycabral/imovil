import { type PropertyImage } from '@/shared'
import { describe, expect, it } from 'vitest'
import { PROPERTY_FORM_DEFAULTS, type PropertyFormValues } from './property-form-schema'
import { buildPropertyPayload, parseDescription } from './property-payload'

describe('parseDescription', () => {
  it('splits paragraphs on one or more blank lines', () => {
    expect(parseDescription('Primeiro\n\nSegundo')).toEqual(['Primeiro', 'Segundo'])
    expect(parseDescription('Um\n\n\n\nDois')).toEqual(['Um', 'Dois'])
  })

  it('trims blocks and drops empties', () => {
    expect(parseDescription('  Um  \n\n  \n\n Dois ')).toEqual(['Um', 'Dois'])
  })

  it('does not split on a single newline', () => {
    expect(parseDescription('linha 1\nlinha 2')).toEqual(['linha 1\nlinha 2'])
  })

  it('returns an empty array for blank/whitespace-only input', () => {
    expect(parseDescription('')).toEqual([])
    expect(parseDescription('   \n\n   ')).toEqual([])
  })
})

describe('buildPropertyPayload', () => {
  const images: PropertyImage[] = [{ path: 'p/1.jpg', src: 'https://x/1.jpg', alt: 'frente' }]
  const description = ['Bloco 1', 'Bloco 2']

  function values(over: Partial<PropertyFormValues> = {}): PropertyFormValues {
    return { ...PROPERTY_FORM_DEFAULTS, title: 'Apto 2q', postalCode: '69000-000', ...over }
  }

  it('maps form values field-for-field', () => {
    const payload = buildPropertyPayload(
      values({ kind: 'apartment', deal: 'sale' }),
      images,
      description,
    )
    expect(payload.title).toBe('Apto 2q')
    expect(payload.postalCode).toBe('69000-000')
    expect(payload.kind).toBe('apartment')
    expect(payload.deal).toBe('sale')
  })

  it('passes through the parsed description + uploaded images', () => {
    const payload = buildPropertyPayload(values(), images, description)
    expect(payload.description).toBe(description)
    expect(payload.images).toBe(images)
  })

  it('always seeds details as an empty array (filled elsewhere)', () => {
    expect(buildPropertyPayload(values(), images, description).details).toEqual([])
  })
})
