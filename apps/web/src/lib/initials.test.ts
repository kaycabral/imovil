import { describe, expect, it } from 'vitest'
import { initials } from './initials'

describe('initials', () => {
  it('duas palavras → 2 iniciais maiúsculas', () => {
    expect(initials('Juliana Prado')).toBe('JP')
  })

  it('uma palavra → 2 primeiras letras em maiúscula', () => {
    expect(initials('Juliana')).toBe('JU')
  })

  it('fallback pro email quando o primary é null', () => {
    expect(initials(null, 'juliana@example.com')).toBe('JU')
  })

  it('retorna "?" quando ambos são null', () => {
    expect(initials(null, null)).toBe('?')
    expect(initials(null)).toBe('?')
  })

  it('ignora espaços extras / strings vazias', () => {
    expect(initials('   ')).toBe('?')
    expect(initials('  Juliana   Prado  ')).toBe('JP')
  })

  it('ignora nomes compostos com mais de 2 palavras', () => {
    expect(initials('Juliana Maria Prado Santos')).toBe('JM')
  })

  it('usa o fallback quando o primary é string vazia/whitespace (não só null)', () => {
    expect(initials('', 'Maria Souza')).toBe('MS')
    expect(initials('   ', 'carlos@example.com')).toBe('CA')
  })
})
