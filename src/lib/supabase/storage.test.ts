import { describe, expect, it } from 'vitest'
import { propertyImagePath } from './storage'

describe('propertyImagePath', () => {
  it('nests the file under the owner folder with a unique prefix', () => {
    expect(propertyImagePath('user-1', 'sala.jpg', 'abc')).toBe('user-1/abc-sala.jpg')
  })

  it('makes accents, spaces and symbols URL-safe', () => {
    expect(propertyImagePath('u', 'Fachada do prédio (1).JPG', 'x')).toBe(
      'u/x-Fachada-do-predio-1-.JPG',
    )
  })

  it('falls back to a generic name when nothing usable is left', () => {
    expect(propertyImagePath('u', '###', 'x')).toBe('u/x-image')
  })
})
