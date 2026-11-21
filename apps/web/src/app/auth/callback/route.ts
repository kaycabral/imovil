import { logger } from '@cbrl/log'
import { authCallbackRoute } from '@cbrl/supabase/routes'

/**
 * OAuth (PKCE) return leg: Google → Supabase → here with `?code`. Exchanges the
 * code for a session cookie and lands on `next` (same-origin only). Any failure
 * goes back to the listing with a flag the UI turns into a toast.
 */
export const GET = authCallbackRoute({
  defaultNext: '/painel',
  failurePath: '/imoveis?login_error=1',
  onError: (error) => logger.warn('auth code exchange failed', { err: error }),
})
