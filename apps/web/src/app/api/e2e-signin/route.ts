import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Test-only sign-in for Playwright: email + password against the LOCAL Supabase
 * stack (password sign-in is enabled only in `supabase/config.toml`; production
 * allows Google only). The Supabase server client writes the real session
 * cookies, which the E2E fixture saves as `storageState`. 404 unless
 * `ENABLE_TEST_AUTH=true` is set explicitly (the Playwright web server sets it).
 */
export async function POST(request: NextRequest) {
  if (process.env.ENABLE_TEST_AUTH !== 'true') {
    return new NextResponse(null, { status: 404 })
  }
  const body: unknown = await request.json()
  if (
    typeof body !== 'object' ||
    body === null ||
    !('email' in body) ||
    !('password' in body) ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string'
  ) {
    return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
  }
  const supabase = await createSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: 'supabase not configured' }, { status: 503 })

  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 401 })
  return NextResponse.json({ userId: data.user.id })
}
