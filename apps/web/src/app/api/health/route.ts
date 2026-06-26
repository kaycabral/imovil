import { NextResponse } from 'next/server'

// Liveness + deploy-verification endpoint. Post-deploy smoke polls this until
// `commit` matches the rolled-out SHA. GIT_COMMIT_SHA is injected at deploy time
// by Cloud Run (--set-env-vars); NEXT_PUBLIC_COMMIT_SHA is the App Hosting
// build-time fallback (kept until that path is retired). Must be dynamic — a
// cached response would pin a stale commit.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  return NextResponse.json({
    status: 'ok',
    commit: process.env.GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_COMMIT_SHA ?? null,
    revision: process.env.K_REVISION ?? null,
    time: new Date().toISOString(),
  })
}
