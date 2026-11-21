import { imovilDb } from '@/db/db'
import { profiles } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export type Profile = {
  id: string
  displayName: string | null
  avatarUrl: string | null
  phone: string | null
  creci: string | null
}

export async function getProfile(id: string): Promise<Profile | null> {
  const [row] = await imovilDb
    .db()
    .select({
      id: profiles.id,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      phone: profiles.phone,
      creci: profiles.creci,
    })
    .from(profiles)
    .where(eq(profiles.id, id))
    .limit(1)
  return row ?? null
}

/** Broker contact shown on listings. Returns false when the profile row does not exist. */
export async function updateProfileContact(
  id: string,
  contact: { phone: string; creci: string },
): Promise<boolean> {
  const rows = await imovilDb
    .db()
    .update(profiles)
    .set({ ...contact, updatedAt: sql`now()` })
    .where(eq(profiles.id, id))
    .returning({ id: profiles.id })
  return rows.length > 0
}
