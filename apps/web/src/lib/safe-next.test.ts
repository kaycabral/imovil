import { describe, expect, it } from 'vitest'
import { safeNext } from './safe-next'

describe('safeNext', () => {
  it('keeps same-origin paths (with query)', () => {
    expect(safeNext('/painel')).toBe('/painel')
    expect(safeNext('/imoveis?deal=sale')).toBe('/imoveis?deal=sale')
  })

  it('returns null for a missing or empty value', () => {
    expect(safeNext(null)).toBeNull()
    expect(safeNext('')).toBeNull()
  })

  it('rejects absolute URLs and relative paths', () => {
    expect(safeNext('https://evil.example.com')).toBeNull()
    expect(safeNext('painel')).toBeNull()
  })

  it('rejects protocol-relative and backslash tricks', () => {
    expect(safeNext('//evil.example.com')).toBeNull()
    expect(safeNext('/\\evil.example.com')).toBeNull()
  })
})
