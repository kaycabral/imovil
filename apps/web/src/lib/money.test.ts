import { describe, expect, it } from 'vitest'
import { formatBRLFromCents, formatBRLFromCentsRounded } from './money'

describe('formatBRLFromCents', () => {
  it('formata centavos como moeda BRL com duas casas', () => {
    expect(formatBRLFromCents(280050)).toMatch(/R\$\s*2\.800,50/)
    expect(formatBRLFromCents(100)).toMatch(/R\$\s*1,00/)
    expect(formatBRLFromCents(1)).toMatch(/R\$\s*0,01/)
    expect(formatBRLFromCents(0)).toMatch(/R\$\s*0,00/)
  })

  it('preserva milhar com separador pt-BR', () => {
    expect(formatBRLFromCents(12345678)).toMatch(/R\$\s*123\.456,78/)
  })

  it('não explode com null/undefined — trata como zero', () => {
    // @ts-expect-error — testando resiliência a input inválido
    expect(formatBRLFromCents(null)).toMatch(/R\$\s*0,00/)
    // @ts-expect-error — testando resiliência a input inválido
    expect(formatBRLFromCents(undefined)).toMatch(/R\$\s*0,00/)
  })
})

describe('formatBRLFromCentsRounded', () => {
  it('arredonda para real mais próximo (sem casas decimais)', () => {
    expect(formatBRLFromCentsRounded(280050)).toMatch(/R\$\s*2\.801/)
    expect(formatBRLFromCentsRounded(280049)).toMatch(/R\$\s*2\.800/)
    expect(formatBRLFromCentsRounded(100)).toMatch(/R\$\s*1$/)
  })

  it('não explode com null/undefined — trata como zero', () => {
    // @ts-expect-error — testando resiliência a input inválido
    expect(formatBRLFromCentsRounded(null)).toMatch(/R\$\s*0/)
    // @ts-expect-error — testando resiliência a input inválido
    expect(formatBRLFromCentsRounded(undefined)).toMatch(/R\$\s*0/)
  })
})
