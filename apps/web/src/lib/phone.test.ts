import { describe, expect, it } from 'vitest'
import { formatPhoneBR } from './phone'

describe('formatPhoneBR', () => {
  it('formata conforme o usuário digita', () => {
    expect(formatPhoneBR('')).toBe('')
    expect(formatPhoneBR('9')).toBe('(9')
    expect(formatPhoneBR('92')).toBe('(92')
    expect(formatPhoneBR('923')).toBe('(92) 3')
    expect(formatPhoneBR('923456')).toBe('(92) 3456')
    expect(formatPhoneBR('9234567')).toBe('(92) 3456-7')
    expect(formatPhoneBR('9234567890')).toBe('(92) 3456-7890')
  })

  it('usa o formato de celular com 11 dígitos', () => {
    expect(formatPhoneBR('92987654321')).toBe('(92) 98765-4321')
  })

  it('corta excedente além de 11 dígitos', () => {
    expect(formatPhoneBR('929876543219999')).toBe('(92) 98765-4321')
  })

  it('ignora caracteres não-numéricos no input', () => {
    expect(formatPhoneBR('(92) 98765-4321')).toBe('(92) 98765-4321')
    expect(formatPhoneBR('92 98765 4321')).toBe('(92) 98765-4321')
  })
})
