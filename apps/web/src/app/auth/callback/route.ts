import { safeNext } from '@/lib/safe-next'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * OAuth (PKCE) return leg: Google → Supabase → here with `?code`. Exchanges the
 * code for a session cookie and lands on `next` (same-origin only). Any failure
 * goes back to the listing with a flag the UI turns into a toast.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next')) ?? '/painel'

  const supabase = code ? await createSupabaseServerClient() : null
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
    console.error('[auth] code exchange failed:', error.message)
  }
  return NextResponse.redirect(new URL('/imoveis?login_error=1', origin))
}
