import { getPropertyVisibility } from '@/db/queries/properties'
import { isPropertyNotFound, propertySlugFromPath } from '@/lib/proxy/property-gate'
import { logger } from '@cbrl/log'
import { supabasePublicConfig } from '@cbrl/supabase'
import { updateSession } from '@cbrl/supabase/proxy'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search)
  const response = await updateSession(request, {
    requestHeaders,
    onError: (error) => logger.warn('session refresh failed', { err: error }),
  })

  const slug = propertySlugFromPath(request.nextUrl.pathname)
  if (slug === null) return response
  const notFound = await isPropertyNotFound(slug, {
    lookup: getPropertyVisibility,
    viewerId: () => viewerId(request),
  })
  if (!notFound) return response
  // Real 404 before the page streams (Cache Components sends the shell with a
  // 200). Keep any cookie the session refresh just rotated.
  const notFoundResponse = NextResponse.rewrite(new URL('/_not-found', request.url), {
    status: 404,
  })
  for (const cookie of response.cookies.getAll()) notFoundResponse.cookies.set(cookie)
  return notFoundResponse
}

/**
 * The signed-in user id, read only for unpublished properties (the owner keeps
 * seeing drafts and paused listings). `updateSession` already refreshed the
 * cookies on `request`, so this only verifies the JWT.
 */
async function viewerId(request: NextRequest): Promise<string | null> {
  const config = supabasePublicConfig()
  if (!config) return null
  const supabase = createServerClient(config.url, config.key, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  })
  const { data } = await supabase.auth.getClaims()
  return data?.claims.sub ?? null
}

export const config = {
  // Every page and route handler (session refresh), skipping static assets and
  // the CSP report endpoint (browsers post reports without credentials).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/csp-report|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|webmanifest)$).*)',
  ],
}
