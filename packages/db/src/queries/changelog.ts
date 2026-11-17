import { desc } from 'drizzle-orm'
import { getImovilDb } from '../pool'
import { changelog } from '../schema'

export type Release = {
  tagName: string
  name: string
  body: string
  publishedAt: string | null
}

export async function listReleases(limit: number): Promise<Release[]> {
  const rows = await getImovilDb()
    .select()
    .from(changelog)
    .orderBy(desc(changelog.publishedAt))
    .limit(limit)
  return rows.map((r) => ({ ...r, publishedAt: r.publishedAt?.toISOString() ?? null }))
}
