import { imovilDb } from '@/lib/db'
import { logger } from '@cbrl/log'
import { healthRoute } from '@cbrl/next/server'

// Health endpoint: confirms which commit is serving and that the database
// answers (uncached). Also the target of the daily Vercel Cron (vercel.json),
// which keeps the Supabase Free project from pausing after 7 idle days.
export const GET = healthRoute({
  ping: imovilDb.ping,
  onError: (error) => logger.error('health ping failed', { err: error }),
})
