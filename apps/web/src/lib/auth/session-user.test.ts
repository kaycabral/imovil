import { describe, expect, it } from 'vitest'
import { toSessionUser } from './session-user'

describe('toSessionUser', () => {
  it('maps the Google metadata keys used by Supabase', () => {
    expect(
      toSessionUser({
        id: 'u1',
        email: 'ana@example.com',
        metadata: { full_name: 'Ana Souza', avatar_url: 'https://example.com/a.png' },
      }),
    ).toEqual({
      id: 'u1',
      email: 'ana@example.com',
      name: 'Ana Souza',
      avatarUrl: 'https://example.com/a.png',
    })
  })

  it('falls back to the OIDC `name` / `picture` keys', () => {
    expect(
      toSessionUser({
        id: 'u1',
        metadata: { name: 'Ana', picture: 'https://example.com/p.png' },
      }),
    ).toMatchObject({ name: 'Ana', avatarUrl: 'https://example.com/p.png' })
  })

  it('prefers full_name over name and skips empty or non-string values', () => {
    expect(
      toSessionUser({
        id: 'u1',
        metadata: { full_name: '', name: 'Ana', avatar_url: 42, picture: 'https://x/p.png' },
      }),
    ).toMatchObject({ name: 'Ana', avatarUrl: 'https://x/p.png' })
  })

  it('returns nulls when email and metadata are absent', () => {
    expect(toSessionUser({ id: 'u1', email: null, metadata: undefined })).toEqual({
      id: 'u1',
      email: null,
      name: null,
      avatarUrl: null,
    })
  })
})
