import { readBackend } from '@/lib/backend-read'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabasePublicConfig } from './config'

/**
 * Refresh the Supabase session cookie on the way in, so Server Components see a
 * valid token. Follows the `@supabase/ssr` contract: cookies written by the
 * client go both to the forwarded request and to the response (with the
 * no-store headers the library asks for). A Supabase outage only skips the
 * refresh — the request still goes through.
 */
export async function updateSession(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<NextResponse> {
  let response = NextResponse.next({ request: { headers: requestHeaders } })
  const config = supabasePublicConfig()
  if (!config) return response

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request: { headers: requestHeaders } })
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options)
        }
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value)
      },
    },
  })

  await readBackend('session refresh', () => supabase.auth.getClaims())
  return response
}
