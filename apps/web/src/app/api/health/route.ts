import { readBackend } from '@/lib/backend-read'
import { pingImovilDb } from '@/lib/db'
import { NextResponse } from 'next/server'

// Health endpoint: confirms which commit is serving and that the database
// answers. Also the target of the daily Vercel Cron (vercel.json), which keeps
// the Supabase Free project from pausing after 7 idle days. Must be dynamic —
// a cached response would pin a stale result.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const commit = process.env.NEXT_PUBLIC_COMMIT_SHA ?? null
  const database = await readBackend('health ping', pingImovilDb)
  return database.ok
    ? NextResponse.json({ status: 'ok', commit, database: 'ok' })
    : NextResponse.json({ status: 'error', commit, database: 'unreachable' }, { status: 503 })
}
