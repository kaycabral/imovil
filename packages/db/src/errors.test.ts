import { describe, expect, it } from 'vitest'
import { isUniqueViolation } from './errors'

function pgError(code: string, constraint?: string): Error {
  return Object.assign(new Error('pg'), { code, constraint })
}

describe('isUniqueViolation', () => {
  it('detects 23505 on the error itself', () => {
    expect(isUniqueViolation(pgError('23505'))).toBe(true)
  })

  it('detects 23505 wrapped in cause (Drizzle query errors)', () => {
    const wrapped = new Error('Failed query', { cause: pgError('23505', 'properties_slug_unique') })
    expect(isUniqueViolation(wrapped)).toBe(true)
    expect(isUniqueViolation(wrapped, 'properties_slug_unique')).toBe(true)
    expect(isUniqueViolation(wrapped, 'other')).toBe(false)
  })

  it('ignores other errors and non-errors', () => {
    expect(isUniqueViolation(pgError('23503'))).toBe(false)
    expect(isUniqueViolation(new Error('plain'))).toBe(false)
    expect(isUniqueViolation('23505')).toBe(false)
    expect(isUniqueViolation(undefined)).toBe(false)
  })
})
