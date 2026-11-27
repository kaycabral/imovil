import { logger } from '@cbrl/log'
import { updateSession } from '@cbrl/supabase/proxy'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search)
  return updateSession(request, {
    requestHeaders,
    onError: (error) => logger.warn('session refresh failed', { err: error }),
  })
}

export const config = {
  // Every page and route handler (session refresh), skipping static assets and
  // the CSP report endpoint (browsers post reports without credentials).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/csp-report|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|webmanifest)$).*)',
  ],
}
