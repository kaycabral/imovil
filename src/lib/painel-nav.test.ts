import { describe, expect, it } from 'vitest'
import { getNavItems, isActive } from './painel-nav'

describe('getNavItems', () => {
  it('always includes overview + imóveis', () => {
    expect(getNavItems({ leads: false }).map((i) => i.href)).toEqual(['/painel', '/painel/imoveis'])
  })

  it('gates the leads item behind the leads feature', () => {
    expect(getNavItems({ leads: true }).map((i) => i.href)).toEqual([
      '/painel',
      '/painel/imoveis',
      '/painel/leads',
    ])
    expect(getNavItems({ leads: false }).some((i) => i.href === '/painel/leads')).toBe(false)
  })
})

describe('isActive', () => {
  it('matches /painel only on the exact path (not subpaths)', () => {
    expect(isActive('/painel', '/painel')).toBe(true)
    expect(isActive('/painel/imoveis', '/painel')).toBe(false)
    expect(isActive('/painel/leads', '/painel')).toBe(false)
  })

  it('matches the other items by prefix, including subpaths', () => {
    expect(isActive('/painel/imoveis', '/painel/imoveis')).toBe(true)
    expect(isActive('/painel/imoveis/123', '/painel/imoveis')).toBe(true)
    expect(isActive('/painel/leads', '/painel/imoveis')).toBe(false)
  })
})
