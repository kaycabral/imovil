import { imovilDb } from '@/db/db'
import { changelog } from '@/db/schema'
import { desc } from 'drizzle-orm'

export type Release = {
  tagName: string
  name: string
  body: string
  publishedAt: string | null
}

export async function listReleases(limit: number): Promise<Release[]> {
  const rows = await imovilDb
    .db()
    .select()
    .from(changelog)
    .orderBy(desc(changelog.publishedAt))
    .limit(limit)
  return rows.map((r) => ({ ...r, publishedAt: r.publishedAt?.toISOString() ?? null }))
}
