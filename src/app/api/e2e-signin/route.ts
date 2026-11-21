import { testSignInRoute } from '@cbrl/supabase/routes'

/**
 * Test-only sign-in for Playwright: email + password against the LOCAL Supabase
 * stack (password sign-in is enabled only in `supabase/config.toml`; production
 * allows Google only). 404 unless `ENABLE_TEST_AUTH=true` (the Playwright web
 * server sets it), and always 404 when `VERCEL_ENV=production`.
 */
export const POST = testSignInRoute()
