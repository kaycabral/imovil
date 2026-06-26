import { describe, expect, it } from 'vitest'
import {
  formatPostalCode,
  PROPERTY_FORM_DEFAULTS,
  propertyFormSchema,
  type PropertyFormValues,
} from './property-form-schema'

describe('formatPostalCode', () => {
  it('formats 8 digits as the DDDDD-DDD CEP mask', () => {
    expect(formatPostalCode('01310100')).toBe('01310-100')
  })

  it('leaves 5 or fewer digits unmasked', () => {
    expect(formatPostalCode('013')).toBe('013')
    expect(formatPostalCode('01310')).toBe('01310')
  })

  it('strips non-digits and truncates past 8', () => {
    expect(formatPostalCode('01.310-100')).toBe('01310-100')
    expect(formatPostalCode('013101009')).toBe('01310-100')
  })
})

// Spread the empty-form defaults, then fill the required fields so the base is
// valid. Each invalid case below tweaks one field to assert its rule fires.
const VALID: PropertyFormValues = {
  ...PROPERTY_FORM_DEFAULTS,
  title: 'Apartamento central',
  postalCode: '01310100',
  neighborhood: 'Centro',
  state: 'SP',
  city: 'São Paulo',
  price: 250000,
  area: 60,
  descriptionText: 'Lindo apê reformado.',
}

describe('propertyFormSchema', () => {
  it('accepts a fully-filled valid form', () => {
    expect(propertyFormSchema.safeParse(VALID).success).toBe(true)
  })

  it('rejects the empty defaults (price/area/title/CEP unset)', () => {
    expect(propertyFormSchema.safeParse(PROPERTY_FORM_DEFAULTS).success).toBe(false)
  })

  it.each([
    ['title', { title: 'ab' }],
    ['postalCode', { postalCode: '0131010' }],
    ['state', { state: 'S' }],
    ['price', { price: 0 }],
    ['area', { area: 0 }],
    ['builtYear', { builtYear: 1800 }],
    ['neighborhood', { neighborhood: '' }],
    ['descriptionText', { descriptionText: '' }],
  ])('rejects an invalid %s', (field, override) => {
    const result = propertyFormSchema.safeParse({ ...VALID, ...override })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === field)).toBe(true)
    }
  })
})
