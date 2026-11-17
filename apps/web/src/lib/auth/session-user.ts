/** The signed-in user as the app sees it (server and client). */
export type SessionUser = {
  id: string
  email: string | null
  name: string | null
  avatarUrl: string | null
}

type Metadata = Record<string, unknown> | undefined

function text(metadata: Metadata, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata?.[key]
    if (typeof value === 'string' && value.length > 0) return value
  }
  return null
}

/** Maps a Supabase user / JWT claims (Google identity metadata) to `SessionUser`. */
export function toSessionUser(source: {
  id: string
  email?: string | null
  metadata: Metadata
}): SessionUser {
  return {
    id: source.id,
    email: source.email ?? null,
    name: text(source.metadata, 'full_name', 'name'),
    avatarUrl: text(source.metadata, 'avatar_url', 'picture'),
  }
}
