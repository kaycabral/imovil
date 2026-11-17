import { sql } from 'drizzle-orm'
import type { ImovilDb } from './pool'
import { profiles, properties } from './schema'

export type SeedUserInput = {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string | null
  phone?: string | null
  creci?: string | null
}

/**
 * Insert a LOCAL auth user (the `on_auth_user_created` trigger creates its
 * profile) and fill the broker contact. Fixture builder for the integration
 * suite and local dev only — never point it at Supabase production; real users
 * come from Google sign-in.
 */
export async function seedUser(db: ImovilDb, input: SeedUserInput): Promise<void> {
  const metadata = JSON.stringify({
    full_name: input.displayName ?? null,
    avatar_url: input.avatarUrl ?? null,
  })
  // GoTrue scans the token columns as non-null strings: leaving them NULL breaks
  // its admin API ("Database error finding users"), so seed them as ''.
  await db.execute(sql`
    insert into auth.users (
      id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    )
    values (
      ${input.id}, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      ${input.email}, ${metadata}::jsonb, now(), now(), '', '', '', '', '', '', '', ''
    )`)
  if (input.phone !== undefined || input.creci !== undefined) {
    await db
      .update(profiles)
      .set({ phone: input.phone ?? null, creci: input.creci ?? null })
      .where(sql`${profiles.id} = ${input.id}`)
  }
}

export type SeedPropertyInput = typeof properties.$inferInsert

export async function seedProperty(db: ImovilDb, input: SeedPropertyInput): Promise<string> {
  const [row] = await db.insert(properties).values(input).returning({ id: properties.id })
  if (!row) throw new Error('seedProperty: insert returned no row')
  return row.id
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', 'postgres'])

/** Throws unless `POSTGRES_URL` points at a local database — the reset wipes every auth user. */
export function assertLocalDatabase(): void {
  const raw = process.env.POSTGRES_URL
  const host = raw ? new URL(raw).hostname : '(unset)'
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`refusing to reset a non-local database (host: ${host})`)
  }
}

/** Empty app tables and LOCAL auth users (tests / local reset only). */
export async function truncateImovilTables(db: ImovilDb): Promise<void> {
  assertLocalDatabase()
  await db.execute(sql`truncate table properties, profiles, changelog restart identity cascade`)
  await db.execute(sql`delete from auth.users`)
}
